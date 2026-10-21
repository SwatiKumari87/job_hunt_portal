import React from 'react'
import { Badge } from './ui/badge'
import { useNavigate } from 'react-router-dom'
import { MapPin, Building2 } from 'lucide-react'

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

const LatestJobCards = ({ job }) => {
    const navigate = useNavigate();
    return (
        <div 
            onClick={() => navigate(`/description/${job._id}`)} 
            className='p-5 rounded-xl shadow-sm hover:shadow-md transition-all bg-white border border-gray-100 cursor-pointer flex flex-col justify-between'
        >
            <div>
                <div className='flex items-center justify-between'>
                    <h2 className='font-bold text-base text-gray-800 flex items-center gap-1.5'>
                        <Building2 className='w-4 h-4 text-purple-600' />
                        <span>{job?.company?.name || "Hiring Partner"}</span>
                    </h2>
                    <span className='text-xs text-gray-400 flex items-center gap-1'>
                        <MapPin className='w-3 h-3' />
                        <span>{job?.location || "Remote"}</span>
                    </span>
                </div>
                <div className='my-3'>
                    <h1 className='font-bold text-lg text-gray-900 line-clamp-1'>{job?.title}</h1>
                    <p className='text-xs text-gray-600 line-clamp-2 mt-1 leading-relaxed'>{cleanText(job?.description)}</p>
                </div>
            </div>
            <div className='flex flex-wrap items-center gap-2 mt-4 pt-2 border-t border-gray-50'>
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
    )
}

export default LatestJobCards