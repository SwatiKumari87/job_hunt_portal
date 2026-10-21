import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.resolve(__dirname, "../data/db.json");

function generateId() {
    return crypto.randomBytes(12).toString("hex");
}

class LocalDatabase {
    constructor() {
        this.data = {
            users: [],
            companies: [],
            jobs: [],
            applications: []
        };
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(DB_FILE)) {
                const content = fs.readFileSync(DB_FILE, "utf-8");
                if (content.trim()) {
                    this.data = JSON.parse(content);
                }
            } else {
                this.save();
            }
        } catch (err) {
            console.error("Error loading local DB, initializing empty:", err.message);
            this.save();
        }
    }

    save() {
        try {
            const dir = path.dirname(DB_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
        } catch (err) {
            console.error("Error writing to local DB:", err.message);
        }
    }
}

export const localDb = new LocalDatabase();

export class LocalDoc {
    constructor(collectionName, data) {
        this._collectionName = collectionName;
        Object.assign(this, data);
        if (!this._id) {
            this._id = generateId();
        }
        if (!this.createdAt) {
            this.createdAt = new Date().toISOString();
        }
        this.updatedAt = new Date().toISOString();
    }

    async save() {
        this.updatedAt = new Date().toISOString();
        const collection = localDb.data[this._collectionName] || [];
        const index = collection.findIndex(item => String(item._id) === String(this._id));
        
        // Strip out private metadata before saving
        const plainData = { ...this };
        delete plainData._collectionName;

        if (index >= 0) {
            collection[index] = plainData;
        } else {
            collection.push(plainData);
        }
        localDb.data[this._collectionName] = collection;
        localDb.save();
        return this;
    }
}

class LocalQuery {
    constructor(collectionName, filter = {}) {
        this.collectionName = collectionName;
        this.filter = filter;
        this.populateFields = [];
        this.sortOrder = null;
        this.isSingle = false;
    }

    populate(pathOrObj) {
        if (typeof pathOrObj === "string") {
            this.populateFields.push({ path: pathOrObj });
        } else if (pathOrObj && typeof pathOrObj === "object") {
            this.populateFields.push(pathOrObj);
        }
        return this;
    }

    sort(order) {
        this.sortOrder = order;
        return this;
    }

    _matches(item, filter) {
        if (!filter || Object.keys(filter).length === 0) return true;

        if (filter._id && String(item._id) !== String(filter._id)) {
            return false;
        }

        if (filter.$or && Array.isArray(filter.$or)) {
            const orMatches = filter.$or.some(subFilter => this._matches(item, subFilter));
            if (!orMatches) return false;
        }

        for (const [key, val] of Object.entries(filter)) {
            if (key === "$or" || key === "_id") continue;

            if (val && typeof val === "object" && val.$regex) {
                const regex = new RegExp(val.$regex, val.$options || "i");
                const itemVal = String(item[key] || "");
                if (!regex.test(itemVal)) return false;
            } else if (val !== undefined && item[key] !== val) {
                if (String(item[key]) !== String(val)) {
                    return false;
                }
            }
        }
        return true;
    }

    _populateItem(item) {
        const cloned = { ...item };
        for (const pop of this.populateFields) {
            const field = pop.path;
            if (field === "company" && cloned.company) {
                const compId = cloned.company._id || cloned.company;
                const company = localDb.data.companies.find(c => String(c._id) === String(compId));
                if (company) cloned.company = { ...company };
            } else if (field === "applications") {
                const appIds = cloned.applications || [];
                cloned.applications = appIds.map(appId => {
                    const id = appId._id || appId;
                    const app = localDb.data.applications.find(a => String(a._id) === String(id));
                    if (!app) return appId;
                    const populatedApp = { ...app };
                    if (pop.populate && pop.populate.path === "applicant") {
                        const applicant = localDb.data.users.find(u => String(u._id) === String(app.applicant));
                        if (applicant) populatedApp.applicant = { ...applicant };
                    }
                    return populatedApp;
                });
            } else if (field === "job" && cloned.job) {
                const jobId = cloned.job._id || cloned.job;
                const job = localDb.data.jobs.find(j => String(j._id) === String(jobId));
                if (job) {
                    const populatedJob = { ...job };
                    if (pop.populate && pop.populate.path === "company") {
                        const company = localDb.data.companies.find(c => String(c._id) === String(job.company));
                        if (company) populatedJob.company = { ...company };
                    }
                    cloned.job = populatedJob;
                }
            } else if (field === "applicant" && cloned.applicant) {
                const userId = cloned.applicant._id || cloned.applicant;
                const user = localDb.data.users.find(u => String(u._id) === String(userId));
                if (user) cloned.applicant = { ...user };
            }
        }
        return new LocalDoc(this.collectionName, cloned);
    }

    async exec() {
        const collection = localDb.data[this.collectionName] || [];
        let results = collection.filter(item => this._matches(item, this.filter));

        if (this.sortOrder) {
            if (this.sortOrder.createdAt === -1) {
                results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            } else if (this.sortOrder.createdAt === 1) {
                results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            }
        }

        const populated = results.map(item => this._populateItem(item));

        if (this.isSingle) {
            return populated.length > 0 ? populated[0] : null;
        }
        return populated;
    }

    then(resolve, reject) {
        return this.exec().then(resolve, reject);
    }

    catch(reject) {
        return this.exec().catch(reject);
    }
}

export function createLocalModel(collectionName) {
    return {
        find(filter = {}) {
            return new LocalQuery(collectionName, filter);
        },

        findOne(filter = {}) {
            const query = new LocalQuery(collectionName, filter);
            query.isSingle = true;
            return query;
        },

        findById(id) {
            const query = new LocalQuery(collectionName, { _id: id });
            query.isSingle = true;
            return query;
        },

        async findByIdAndUpdate(id, updateData, options = {}) {
            const collection = localDb.data[collectionName] || [];
            const index = collection.findIndex(item => String(item._id) === String(id));
            if (index < 0) return null;

            collection[index] = {
                ...collection[index],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            localDb.data[collectionName] = collection;
            localDb.save();

            return new LocalDoc(collectionName, collection[index]);
        },

        async create(data) {
            const doc = new LocalDoc(collectionName, data);
            await doc.save();
            return doc;
        }
    };
}
