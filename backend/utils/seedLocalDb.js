import { localDb } from "./localDb.js";
import { fetchLiveJobs } from "./jobScraper.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

function generateId() {
    return crypto.randomBytes(12).toString("hex");
}

export async function seedInitialData() {
    try {
        // Seed default demo users if none exist
        if (!localDb.data.users || localDb.data.users.length === 0) {
            const hashedPassword = await bcrypt.hash("123456", 10);
            
            const demoStudent = {
                _id: generateId(),
                fullname: "Alex Johnson (Demo Student)",
                email: "student@demo.com",
                phoneNumber: 9876543210,
                password: hashedPassword,
                role: "student",
                profile: {
                    bio: "Full Stack Developer passionate about modern web technologies.",
                    skills: ["React", "Node.js", "TypeScript", "TailwindCSS"],
                    profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const demoRecruiter = {
                _id: generateId(),
                fullname: "Sarah Miller (Demo Recruiter)",
                email: "recruiter@demo.com",
                phoneNumber: 9123456780,
                password: hashedPassword,
                role: "recruiter",
                profile: {
                    bio: "Talent Acquisition Lead at Top Tech Global.",
                    profilePhoto: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150"
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            localDb.data.users = [demoStudent, demoRecruiter];
        }

        // Seed live jobs if none exist
        if (!localDb.data.jobs || localDb.data.jobs.length === 0) {
            console.log("Fetching real live jobs from web for initial seed...");
            const liveJobs = await fetchLiveJobs({ count: 12 });
            const recruiter = localDb.data.users.find(u => u.role === "recruiter") || localDb.data.users[0];

            for (const item of liveJobs) {
                // Find or create company
                let company = localDb.data.companies.find(c => c.name.toLowerCase() === item.companyName.toLowerCase());
                if (!company) {
                    company = {
                        _id: generateId(),
                        name: item.companyName,
                        description: `Innovative global technology firm specializing in ${item.requirements.slice(0, 3).join(", ")}.`,
                        website: item.sourceUrl || "https://example.com",
                        location: item.location || "Remote",
                        logo: item.companyLogo || "https://github.com/shadcn.png",
                        userId: recruiter._id,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    localDb.data.companies.push(company);
                }

                const job = {
                    _id: generateId(),
                    title: item.title,
                    description: item.description,
                    requirements: item.requirements,
                    salary: item.salary,
                    location: item.location,
                    jobType: item.jobType,
                    experienceLevel: item.experienceLevel,
                    position: 1,
                    company: company._id,
                    created_by: recruiter._id,
                    applications: [],
                    applyUrl: item.sourceUrl || company.website || "",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                localDb.data.jobs.push(job);
            }
            localDb.save();
            console.log(`Seeded ${localDb.data.jobs.length} jobs and ${localDb.data.companies.length} companies!`);
        }
    } catch (err) {
        console.error("Seeding error:", err.message);
    }
}

// Call seed if run directly
if (process.argv[1] && process.argv[1].endsWith("seedLocalDb.js")) {
    seedInitialData().then(() => {
        console.log("Seeding complete!");
        process.exit(0);
    });
}
