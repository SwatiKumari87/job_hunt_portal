import React, { useEffect, useState } from 'react'
import Navbar from './shared/Navbar'
import FilterCard from './FilterCard'
import Job from './Job';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import useGetAllJobs from '@/hooks/useGetAllJobs';
import { Button } from './ui/button';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { JOB_API_END_POINT, SCRAPE_API_END_POINT } from '@/utils/constant';
import { setAllJobs } from '@/redux/jobSlice';
import { toast } from 'sonner';

const Jobs = () => {
    useGetAllJobs();
    const { allJobs, searchedQuery } = useSelector(store => store.job);
    const [filterJobs, setFilterJobs] = useState(allJobs || []);
    const [scraping, setScraping] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        const safeAllJobs = allJobs || [];
        if (searchedQuery) {
            const filtered = safeAllJobs.filter((job) => {
                return (job?.title || "").toLowerCase().includes(searchedQuery.toLowerCase()) ||
                    (job?.description || "").toLowerCase().includes(searchedQuery.toLowerCase()) ||
                    (job?.location || "").toLowerCase().includes(searchedQuery.toLowerCase())
            });
            setFilterJobs(filtered);
        } else {
            setFilterJobs(safeAllJobs);
        }
    }, [allJobs, searchedQuery]);

    const handleScrapeJobs = async () => {
        try {
            setScraping(true);
            const res = await axios.post(`${SCRAPE_API_END_POINT}?count=50`, {}, { withCredentials: true });
            if (res.data.success) {
                toast.success(res.data.message || "50+ Live jobs scraped and imported successfully!");
                // Refresh jobs list
                const jobsRes = await axios.get(`${JOB_API_END_POINT}/get`, { withCredentials: true });
                if (jobsRes.data.success) {
                    dispatch(setAllJobs(jobsRes.data.jobs));
                }
            }
        } catch (err) {
            console.error("Scraping error:", err);
            toast.error(err?.response?.data?.message || "Failed to scrape jobs from web");
        } finally {
            setScraping(false);
        }
    };

    return (
        <div>
            <Navbar />
            <div className='max-w-7xl mx-auto mt-5 px-4'>
                {/* Header with Scraper Action */}
                <div className='flex flex-wrap items-center justify-between pb-4 border-b border-gray-200 mb-6 gap-3'>
                    <div>
                        <h1 className='font-bold text-2xl text-gray-800'>Explore Opportunities</h1>
                        <p className='text-sm text-gray-500'>Showing {filterJobs.length} available jobs</p>
                    </div>
                    <Button 
                        onClick={handleScrapeJobs} 
                        disabled={scraping}
                        className='bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm flex items-center gap-2'
                    >
                        {scraping ? (
                            <>
                                <Loader2 className='w-4 h-4 animate-spin' />
                                <span>Scraping 50+ Live Feeds...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className='w-4 h-4 text-yellow-300' />
                                <span>Scrape 50+ Live Tech Jobs</span>
                            </>
                        )}
                    </Button>
                </div>

                <div className='flex gap-5'>
                    <div className='w-20% hidden md:block'>
                        <FilterCard />
                    </div>
                    {
                        filterJobs.length <= 0 ? (
                            <div className='flex-1 flex flex-col items-center justify-center py-20 text-center'>
                                <p className='text-gray-500 text-lg mb-4'>No jobs found matching your criteria.</p>
                                <Button 
                                    onClick={handleScrapeJobs} 
                                    disabled={scraping} 
                                    variant='outline'
                                    className='flex items-center gap-2'
                                >
                                    <RefreshCw className={`w-4 h-4 ${scraping ? 'animate-spin' : ''}`} />
                                    <span>Scrape & Import Jobs from Web</span>
                                </Button>
                            </div>
                        ) : (
                            <div className='flex-1 h-[88vh] overflow-y-auto pb-5'>
                                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                    {
                                        filterJobs.map((job) => (
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3 }}
                                                key={job?._id}>
                                                <Job job={job} />
                                            </motion.div>
                                        ))
                                    }
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default Jobs