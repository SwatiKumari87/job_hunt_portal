import { isMongoConnected } from "./db.js";
import { createLocalModel } from "./localDb.js";

export function createDualModel(collectionName, mongooseModel) {
    const localModel = createLocalModel(collectionName);
    return new Proxy(mongooseModel, {
        get(target, prop) {
            if (isMongoConnected) {
                return typeof target[prop] === "function" ? target[prop].bind(target) : target[prop];
            }
            if (prop in localModel) {
                return localModel[prop];
            }
            return typeof target[prop] === "function" ? target[prop].bind(target) : target[prop];
        }
    });
}
