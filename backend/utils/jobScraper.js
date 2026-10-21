import mongoose from "mongoose";
import dotenv from "dotenv";
import { Company } from "../models/company.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import connectDB from "./db.js";

dotenv.config();

/**
 * Fetch and parse jobs from Arbeitnow, RemoteOK, and Jobicy (50+ jobs at a time)
 */
export async function fetchLiveJobs({ count = 50, tag = "" } = {}) {
    const scrapedJobs = [];
    const seenTitles = new Set();

    // Source 1: Arbeitnow API (Very reliable, fast, returns up to 300 jobs with direct apply URLs)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
            signal: controller.signal,
            headers: { "User-Agent": "JobHuntPortal/2.0" }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            const jobList = Array.isArray(data?.data) ? data.data : [];
            for (const item of jobList) {
                if (scrapedJobs.length >= count) break;
                if (!item.title || !item.company_name) continue;

                const key = `${item.title.toLowerCase()}_${item.company_name.toLowerCase()}`;
                if (seenTitles.has(key)) continue;
                seenTitles.add(key);

                const cleanDesc = item.description 
                    ? item.description.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').slice(0, 450) + "..."
                    : "Join this dynamic team in an impactful career role.";

                scrapedJobs.push({
                    title: item.title,
                    companyName: item.company_name,
                    companyLogo: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.company_name)}&background=6A38C2&color=fff&size=128`,
                    description: cleanDesc,
                    requirements: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags : ["Engineering", "Technology", "Remote"],
                    salary: (Math.floor(Math.random() * 45) + 65) * 1000,
                    location: item.location || (item.remote ? "Remote" : "Europe"),
                    jobType: item.job_types?.[0] || "Full-time",
                    experienceLevel: 2,
                    position: 1,
                    sourceUrl: item.url || ""
                });
            }
        }
    } catch (err) {
        console.warn("Failed fetching from Arbeitnow:", err.message);
    }

    // Source 2: RemoteOK API (returns up to 100+ remote developer jobs)
    if (scrapedJobs.length < count) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const res = await fetch("https://remoteok.com/api", {
                signal: controller.signal,
                headers: { "User-Agent": "JobHuntPortal/2.0" }
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                const jobList = Array.isArray(data) ? data.slice(1) : [];
                for (const item of jobList) {
                    if (scrapedJobs.length >= count) break;
                    if (!item.position || !item.company) continue;

                    const key = `${item.position.toLowerCase()}_${item.company.toLowerCase()}`;
                    if (seenTitles.has(key)) continue;
                    seenTitles.add(key);

                    const cleanDesc = item.description 
                        ? item.description.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').slice(0, 450) + "..."
                        : "Exciting technical opportunity.";

                    scrapedJobs.push({
                        title: item.position,
                        companyName: item.company,
                        companyLogo: item.company_logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.company)}&background=4F46E5&color=fff&size=128`,
                        description: cleanDesc,
                        requirements: Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.slice(0, 5) : ["Tech", "Remote", "Engineering"],
                        salary: (item.salary_min && Number(item.salary_min)) || (Math.floor(Math.random() * 40) + 75) * 1000,
                        location: item.location || "Worldwide Remote",
                        jobType: "Full-time",
                        experienceLevel: 3,
                        position: 1,
                        sourceUrl: item.url || ""
                    });
                }
            }
        } catch (err) {
            console.warn("Failed fetching from RemoteOK:", err.message);
        }
    }

    // Source 3: Jobicy API
    if (scrapedJobs.length < count) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const url = `https://jobicy.com/api/v2/remote-jobs?count=20`;
            const response = await fetch(url, {
                signal: controller.signal,
                headers: { "User-Agent": "JobHuntPortal/2.0" }
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data?.jobs)) {
                    for (const item of data.jobs) {
                        if (scrapedJobs.length >= count) break;
                        const key = `${(item.jobTitle||"").toLowerCase()}_${(item.companyName||"").toLowerCase()}`;
                        if (seenTitles.has(key)) continue;
                        seenTitles.add(key);

                        scrapedJobs.push({
                            title: item.jobTitle || "Software Engineer",
                            companyName: item.companyName || "Tech Company",
                            companyLogo: item.companyLogo || "https://github.com/shadcn.png",
                            description: item.jobExcerpt || (item.jobDescription ? item.jobDescription.replace(/<[^>]*>?/gm, ' ').slice(0, 450) : "Exciting remote opportunity."),
                            requirements: Array.isArray(item.jobIndustry) ? item.jobIndustry : (item.jobIndustry ? [item.jobIndustry] : ["JavaScript", "React", "Node.js"]),
                            salary: Number(item.salaryMin) || (Math.floor(Math.random() * 50) + 65) * 1000,
                            location: item.jobGeo || "Remote",
                            jobType: item.jobType || "Full-time",
                            experienceLevel: item.jobLevel === "Senior" ? 5 : item.jobLevel === "Junior" ? 1 : 2,
                            position: 1,
                            sourceUrl: item.url || ""
                        });
                    }
                }
            }
        } catch (err) {
            console.warn("Failed fetching from Jobicy:", err.message);
        }
    }

    return scrapedJobs;
}

/**
 * Ingest scraped jobs into MongoDB
 */
export async function ingestJobs({ count = 50, tag = "", creatorUserId = null } = {}) {
    const jobs = await fetchLiveJobs({ count, tag });
    if (!jobs || jobs.length === 0) {
        return { success: false, message: "No jobs could be scraped.", added: 0 };
    }

    // Find or create a default system user if creatorUserId is not provided
    let userId = creatorUserId;
    if (!userId) {
        let systemUser = await User.findOne({ role: "recruiter" });
        if (!systemUser) {
            systemUser = await User.create({
                fullname: "Job Aggregator Bot",
                email: "bot@jobportal.local",
                phoneNumber: 9999999999,
                password: "system_generated_password",
                role: "recruiter",
                profile: {
                    profilePhoto: "https://github.com/shadcn.png"
                }
            });
        }
        userId = systemUser._id;
    }

    let addedCount = 0;
    const addedJobs = [];

    for (const jobData of jobs) {
        try {
            // Find or create company
            let company = await Company.findOne({ name: jobData.companyName });
            if (!company) {
                company = await Company.create({
                    name: jobData.companyName,
                    description: `Official company page for ${jobData.companyName}`,
                    website: jobData.sourceUrl || "https://example.com",
                    location: jobData.location,
                    logo: jobData.companyLogo,
                    userId: userId
                });
            }

            // Check if job already exists
            const existingJob = await Job.findOne({
                title: jobData.title,
                company: company._id
            });

            if (!existingJob) {
                const createdJob = await Job.create({
                    title: jobData.title,
                    description: jobData.description,
                    requirements: jobData.requirements,
                    salary: Number(jobData.salary) || 80000,
                    location: jobData.location,
                    jobType: jobData.jobType,
                    experienceLevel: Number(jobData.experienceLevel) || 1,
                    position: jobData.position || 1,
                    company: company._id,
                    created_by: userId,
                    applyUrl: jobData.sourceUrl || ""
                });
                addedJobs.push(createdJob);
                addedCount++;
            }
        } catch (err) {
            console.error(`Error ingesting job ${jobData.title}:`, err.message);
        }
    }

    return {
        success: true,
        message: `Successfully scraped and imported ${addedCount} jobs.`,
        added: addedCount,
        jobs: addedJobs
    };
}

// Support running directly from CLI: node utils/jobScraper.js
if (process.argv[1] && process.argv[1].endsWith("jobScraper.js")) {
    (async () => {
        try {
            console.log("Connecting to MongoDB...");
            await connectDB();
            console.log("Starting job scraping & ingestion...");
            const result = await ingestJobs({ count: 15 });
            console.log(result.message);
            process.exit(0);
        } catch (err) {
            console.error("CLI Scraping failed:", err);
            process.exit(1);
        }
    })();
}
