import React from 'react'
import { Button } from './ui/button'
import { Bookmark, ExternalLink } from 'lucide-react'
import { Avatar, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { useNavigate } from 'react-router-dom'

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
        return `$${(num / 1000).toFixed(0)}k/yr`;
    }
    return `₹${num} LPA`;
}

const Job = ({ job }) => {
    const navigate = useNavigate();

    const daysAgoFunction = (mongodbTime) => {
        if (!mongodbTime) return "Recently";
        const createdAt = new Date(mongodbTime);
        const currentTime = new Date();
        const timeDifference = currentTime - createdAt;
        const days = Math.floor(timeDifference / (1000 * 24 * 60 * 60));
        return days <= 0 ? "Today" : `${days}d ago`;
    }

    const realApplyUrl = job?.applyUrl || job?.company?.website || "";

    const handleDirectApply = (e) => {
        e.stopPropagation();
        if (realApplyUrl) {
            window.open(realApplyUrl, '_blank', 'noopener,noreferrer');
        } else {
            navigate(`/description/${job?._id}`);
        }
    };
    
    return (
        <div className='p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white border border-gray-100 flex flex-col justify-between h-full'>
            <div>
                <div className='flex items-center justify-between'>
                    <p className='text-xs text-gray-500 font-medium'>{daysAgoFunction(job?.createdAt)}</p>
                    <Button variant="ghost" className="rounded-full text-gray-400 hover:text-gray-700 h-8 w-8" size="icon">
                        <Bookmark className='w-4 h-4' />
                    </Button>
                </div>

                <div className='flex items-center gap-3 my-3'>
                    <div className="w-12 h-12 rounded-lg border border-gray-100 p-1 flex items-center justify-center bg-gray-50 shrink-0">
                        <Avatar className='w-10 h-10'>
                            <AvatarImage src={job?.company?.logo} alt={job?.company?.name || "Company"} className='object-contain' />
                        </Avatar>
                    </div>
                    <div>
                        <h2 className='font-bold text-base text-gray-900'>{job?.company?.name || "Hiring Partner"}</h2>
                        <p className='text-xs text-gray-500'>{job?.location || "Remote"}</p>
                    </div>
                </div>

                <div>
                    <h1 className='font-bold text-base text-gray-900 my-2 line-clamp-1' title={job?.title}>{job?.title}</h1>
                    <p className='text-xs text-gray-600 line-clamp-3 leading-relaxed'>{cleanText(job?.description)}</p>
                </div>

                <div className='flex flex-wrap items-center gap-2 mt-4'>
                    <Badge className='text-blue-700 bg-blue-50 font-medium text-xs' variant="outline">
                        {job?.position || 1} Openings
                    </Badge>
                    <Badge className='text-[#F83002] bg-red-50 font-medium text-xs' variant="outline">
                        {job?.jobType || "Full-time"}
                    </Badge>
                    <Badge className='text-[#7209b7] bg-purple-50 font-medium text-xs' variant="outline">
                        {formatSalary(job?.salary)}
                    </Badge>
                </div>
            </div>

            <div className='flex items-center gap-2 mt-5 pt-3 border-t border-gray-100'>
                <Button 
                    onClick={() => navigate(`/description/${job?._id}`)} 
                    variant="outline"
                    size="sm"
                    className='flex-1 text-xs'
                >
                    View Details
                </Button>
                {realApplyUrl ? (
                    <Button 
                        onClick={handleDirectApply}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs flex items-center justify-center gap-1.5"
                    >
                        <span>Apply</span>
                        <ExternalLink className='w-3 h-3' />
                    </Button>
                ) : (
                    <Button 
                        onClick={() => navigate(`/description/${job?._id}`)}
                        size="sm"
                        className="flex-1 bg-[#7209b7] text-white text-xs"
                    >
                        Apply
                    </Button>
                )}
            </div>
        </div>
    )
}

export default Job