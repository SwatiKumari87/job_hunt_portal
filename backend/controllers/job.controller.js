import { Job } from "../models/job.model.js";
import { ingestJobs, fetchLiveJobs } from "../utils/jobScraper.js";

// admin post krega job
export const postJob = async (req, res) => {
    try {
        const { title, description, requirements, salary, location, jobType, experience, position, companyId } = req.body;
        const userId = req.id;

        if (!title || !description || !requirements || !salary || !location || !jobType || !companyId) {
            return res.status(400).json({
                message: "Required fields are missing.",
                success: false
            })
        };

        const requirementsArray = Array.isArray(requirements) 
            ? requirements 
            : requirements.split(",").map(r => r.trim()).filter(Boolean);

        const job = await Job.create({
            title,
            description,
            requirements: requirementsArray,
            salary: Number(salary) || 0,
            location,
            jobType,
            experienceLevel: Number(experience) || 1,
            position: Number(position) || 1,
            company: companyId,
            created_by: userId
        });
        return res.status(201).json({
            message: "New job created successfully.",
            job,
            success: true
        });
    } catch (error) {
        console.error("Post job error:", error);
        return res.status(500).json({
            message: "Internal server error while creating job",
            success: false,
            error: error.message
        });
    }
}

// student k liye
export const getAllJobs = async (req, res) => {
    try {
        const keyword = req.query.keyword || "";
        const query = keyword ? {
            $or: [
                { title: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } },
                { location: { $regex: keyword, $options: "i" } },
            ]
        } : {};
        const jobs = await Job.find(query).populate({
            path: "company"
        }).sort({ createdAt: -1 });
        
        return res.status(200).json({
            jobs: jobs || [],
            success: true
        });
    } catch (error) {
        console.error("Get all jobs error:", error);
        return res.status(500).json({
            message: "Internal server error while fetching jobs",
            success: false,
            error: error.message
        });
    }
}

// student
export const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path:"applications"
        }).populate({
            path:"company"
        });
        if (!job) {
            return res.status(404).json({
                message: "Job not found.",
                success: false
            })
        };
        return res.status(200).json({ job, success: true });
    } catch (error) {
        console.error("Get job by id error:", error);
        return res.status(500).json({
            message: "Internal server error while fetching job details",
            success: false,
            error: error.message
        });
    }
}

// admin kitne job create kra hai abhi tk
export const getAdminJobs = async (req, res) => {
    try {
        const adminId = req.id;
        const jobs = await Job.find({ created_by: adminId }).populate({
            path:'company'
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            jobs: jobs || [],
            success: true
        });
    } catch (error) {
        console.error("Get admin jobs error:", error);
        return res.status(500).json({
            message: "Internal server error while fetching admin jobs",
            success: false,
            error: error.message
        });
    }
}

// Scrape live jobs from web and ingest into database
export const scrapeAndIngest = async (req, res) => {
    try {
        const count = Number(req.query.count) || Number(req.body.count) || 50;
        const tag = req.query.tag || req.body.tag || "";
        const userId = req.id || null;

        const result = await ingestJobs({ count, tag, creatorUserId: userId });

        return res.status(200).json({
            message: result.message,
            added: result.added,
            success: true
        });
    } catch (error) {
        console.error("Scrape jobs error:", error);
        return res.status(500).json({
            message: "Failed to scrape jobs from web",
            success: false,
            error: error.message
        });
    }
}

// Preview live scraped jobs without saving
export const previewLiveJobs = async (req, res) => {
    try {
        const count = Number(req.query.count) || 15;
        const tag = req.query.tag || "";
        const jobs = await fetchLiveJobs({ count, tag });
        return res.status(200).json({
            jobs,
            count: jobs.length,
            success: true
        });
    } catch (error) {
        console.error("Preview live jobs error:", error);
        return res.status(500).json({
            message: "Failed to fetch live job feeds",
            success: false,
            error: error.message
        });
    }
}
