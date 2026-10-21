import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getAdminJobs, getAllJobs, getJobById, postJob, scrapeAndIngest, previewLiveJobs } from "../controllers/job.controller.js";

const router = express.Router();

// Job posting & admin routes
router.route("/post").post(isAuthenticated, postJob);
router.route("/getadminjobs").get(isAuthenticated, getAdminJobs);

// Job scraping & ingestion endpoints
router.route("/scrape").post(scrapeAndIngest).get(scrapeAndIngest);
router.route("/live-preview").get(previewLiveJobs);

// Public job browsing
router.route("/get").get(getAllJobs);
router.route("/get/:id").get(getJobById);

export default router;

