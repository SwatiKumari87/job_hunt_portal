import React, { useEffect, useState } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { APPLICATION_API_END_POINT, JOB_API_END_POINT } from '@/utils/constant';
import { setSingleJob } from '@/redux/jobSlice';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import Navbar from './shared/Navbar';
import { ExternalLink, Building2, MapPin, DollarSign, Briefcase, Calendar, CheckCircle2 } from 'lucide-react';

const cleanText = (str) => {
    if (!str) return "";
    return str
        .replace(/&hellip;/g, '...')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

const formatSalary = (salary) => {
    if (!salary) return "Competitive";
    const num = Number(salary);
    if (isNaN(num)) return salary;
    if (num >= 10000) {
        return `$${num.toLocaleString()} / year`;
    }
    return `₹${num} LPA`;
}

const JobDescription = () => {
    const { singleJob } = useSelector(store => store.job);
    const { user } = useSelector(store => store.auth);
    const isInitiallyApplied = singleJob?.applications?.some(application => {
        const applicantId = application?.applicant?._id || application?.applicant || application;
        return applicantId === user?._id;
    }) || false;
    const [isApplied, setIsApplied] = useState(isInitiallyApplied);

    const params = useParams();
    const jobId = params.id;
    const dispatch = useDispatch();

    const realApplyUrl = singleJob?.applyUrl || singleJob?.company?.website || "";

    const handleApplyNow = async () => {
        // 1. If user is logged in, track the application in the system
        if (user?._id) {
            try {
                const res = await axios.get(`${APPLICATION_API_END_POINT}/apply/${jobId}`, { withCredentials: true });
                if (res.data.success) {
                    setIsApplied(true);
                    const updatedSingleJob = {
                        ...singleJob,
                        applications: [...(singleJob.applications || []), { applicant: user._id }]
                    };
                    dispatch(setSingleJob(updatedSingleJob));
                }
            } catch (err) {
                console.log(err);
            }
        }

        // 2. Open the REAL official hiring website in a new tab!
        if (realApplyUrl) {
            toast.success("Redirecting to the official company application page...");
            window.open(realApplyUrl, '_blank', 'noopener,noreferrer');
        } else {
            toast.info("Application recorded successfully.");
        }
    };

    useEffect(() => {
        const fetchSingleJob = async () => {
            try {
                const res = await axios.get(`${JOB_API_END_POINT}/get/${jobId}`, { withCredentials: true });
                if (res.data.success) {
                    dispatch(setSingleJob(res.data.job));
                    const applied = res.data.job.applications?.some(app => {
                        const applicantId = app?.applicant?._id || app?.applicant || app;
                        return applicantId === user?._id;
                    });
                    setIsApplied(Boolean(applied));
                }
            } catch (error) {
                console.log(error);
            }
        }
        fetchSingleJob();
    }, [jobId, dispatch, user?._id]);

    const postedDate = singleJob?.createdAt ? singleJob.createdAt.split("T")[0] : "Recently";
    const experienceVal = singleJob?.experienceLevel || singleJob?.experience || 1;

    return (
        <div>
            <Navbar />
            <div className='max-w-5xl mx-auto my-10 px-4'>
                {/* Header Section */}
                <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
                    <div className='flex items-start gap-4'>
                        {singleJob?.company?.logo && (
                            <img
                                src={singleJob.company.logo}
                                alt={singleJob?.company?.name || "Company"}
                                className='w-16 h-16 rounded-lg object-contain border p-1 bg-gray-50'
                            />
                        )}
                        <div>
                            <h1 className='font-bold text-2xl text-gray-900'>{singleJob?.title}</h1>
                            <div className='flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1'>
                                <span className='font-semibold text-gray-700 flex items-center gap-1'>
                                    <Building2 className='w-4 h-4' /> {singleJob?.company?.name || "Hiring Partner"}
                                </span>
                                <span>•</span>
                                <span className='flex items-center gap-1'>
                                    <MapPin className='w-4 h-4 text-gray-400' /> {singleJob?.location || "Remote"}
                                </span>
                            </div>
                            <div className='flex flex-wrap items-center gap-2 mt-3'>
                                <Badge className='text-blue-700 bg-blue-50 font-medium' variant="outline">
                                    {singleJob?.position || 1} Openings
                                </Badge>
                                <Badge className='text-[#F83002] bg-red-50 font-medium' variant="outline">
                                    {singleJob?.jobType || "Full-time"}
                                </Badge>
                                <Badge className='text-[#7209b7] bg-purple-50 font-medium' variant="outline">
                                    {formatSalary(singleJob?.salary)}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto'>
                        <Button
                            onClick={handleApplyNow}
                            className='w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-6 py-6 rounded-xl shadow-md flex items-center justify-center gap-2'
                        >
                            <span>Apply on Official Website</span>
                            <ExternalLink className='w-4 h-4' />
                        </Button>
                    </div>
                </div>

                {/* Job Overview & Details */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-6'>
                    {/* Left Column: Job Description & Details */}
                    <div className='md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
                        <h2 className='text-lg font-bold text-gray-900 border-b pb-3 mb-4'>Job Description</h2>
                        <div className='text-gray-700 leading-relaxed space-y-4 whitespace-pre-line'>
                            {cleanText(singleJob?.description)}
                        </div>

                        {singleJob?.requirements && singleJob.requirements.length > 0 && (
                            <div className='mt-8 pt-6 border-t'>
                                <h3 className='font-bold text-gray-900 mb-3'>Key Skills & Requirements</h3>
                                <div className='flex flex-wrap gap-2'>
                                    {singleJob.requirements.map((req, idx) => (
                                        <span key={idx} className='bg-gray-100 text-gray-800 text-xs px-3 py-1.5 rounded-full font-medium'>
                                            {cleanText(req)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Key Job Facts & Company Profile */}
                    <div className='space-y-6'>
                        <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
                            <h3 className='font-bold text-gray-900 mb-4 pb-2 border-b text-sm uppercase tracking-wider text-gray-400'>
                                Job Summary
                            </h3>
                            <div className='space-y-4 text-sm'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-gray-500 flex items-center gap-2'><Briefcase className='w-4 h-4' /> Job Type</span>
                                    <span className='font-medium text-gray-800'>{singleJob?.jobType || "Full-time"}</span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-gray-500 flex items-center gap-2'><DollarSign className='w-4 h-4' /> Compensation</span>
                                    <span className='font-medium text-gray-800'>{formatSalary(singleJob?.salary)}</span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-gray-500 flex items-center gap-2'><CheckCircle2 className='w-4 h-4' /> Experience</span>
                                    <span className='font-medium text-gray-800'>{experienceVal} {typeof experienceVal === 'number' ? 'yrs' : ''}</span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-gray-500 flex items-center gap-2'><MapPin className='w-4 h-4' /> Location</span>
                                    <span className='font-medium text-gray-800'>{singleJob?.location || "Remote"}</span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span className='text-gray-500 flex items-center gap-2'><Calendar className='w-4 h-4' /> Posted On</span>
                                    <span className='font-medium text-gray-800'>{postedDate}</span>
                                </div>
                            </div>
                        </div>

                        {/* Company Card */}
                        {singleJob?.company && (
                            <div className='bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
                                <h3 className='font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider text-gray-400'>
                                    About the Company
                                </h3>
                                <h4 className='font-bold text-base text-gray-800'>{singleJob.company.name}</h4>
                                <p className='text-xs text-gray-600 mt-1 line-clamp-3'>
                                    {singleJob.company.description || "Leading innovator in technology."}
                                </p>
                                {realApplyUrl && (
                                    <a
                                        href={realApplyUrl}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 mt-4'
                                    >
                                        <span>Visit Official Career Page</span>
                                        <ExternalLink className='w-3.5 h-3.5' />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default JobDescription