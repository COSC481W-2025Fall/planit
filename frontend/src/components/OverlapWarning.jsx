import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {LOCAL_BACKEND_URL, VITE_BACKEND_URL} from "../../../Constants.js";

export default function OverlapWarning({formStartTime, formDuration, selectedDay, dayIds, activityId}) {
    const [overlappingActivities, setOverlappingActivities] = useState([]);
    const [showOverlapList, setShowOverlapList] = useState(false);

    const formatTime = (timeStr) => {
        if (!timeStr) return "No time";
        const [hours, minutes] = timeStr.split(":").map(Number);
        if (isNaN(hours) || isNaN(minutes)) return timeStr;

        const period = hours >= 12 ? "PM" : "AM";
        const twelveHour = hours % 12 === 0 ? 12 : hours % 12;

        return `${twelveHour}:${minutes.toString().padStart(2, "0")} ${period}`;
    };

    const toggleDropdown = () => {
        setShowOverlapList(prev => !prev);
    };

    // Convert HH:MM:SS to total seconds
    const timeToSeconds = (time) => {
        const [hours, minutes, seconds] = time.split(":").map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    }

    // Convert total seconds to HH:MM:SS
    const secondsToTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Calculate end time and return as HH:MM:SS
    const calculateEndTime = ({a}) => {
        const hours = a.activity_duration.hours || "00";
        const minutes = a.activity_duration.minutes || "00";
        const seconds = a.activity_duration.seconds || "00";
        const timeString = `${hours}:${minutes}:${seconds}`;

        const startSeconds = timeToSeconds(a.activity_startTime);
        const durationSeconds = timeToSeconds(timeString);
        const endSeconds = startSeconds + durationSeconds;
        const endTime = secondsToTime(endSeconds);

        return endTime;
    }

    async function checkOverlap(dayId, startTime, duration, activityId = null) {
        //Choose endpoint either depending if we editing activity or creating new one
        const endpoint = activityId ? "/activities/check-overlap-edit" : "/activities/check-overlap";

        const body = activityId ? {
            dayId, 
            proposedStartTime: startTime, 
            proposedDuration: duration, 
            activityId
        }
        :
        {
            dayId, 
            proposedStartTime: startTime, 
            proposedDuration: duration     
        };

        const res = await fetch(
            `${import.meta.env.VITE_BACKEND_URL || LOCAL_BACKEND_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify((body))
        }
        );
        const data = await res.json();

        if (data.overlappingActivities?.length > 0) {
            setOverlappingActivities(data.overlappingActivities);
        } else {
            setOverlappingActivities([]);
        }
    }
    

    // Check overlap when start time or duration changes
    useEffect(() => {
        if (!formStartTime || !formDuration) {
            setOverlappingActivities([]);
            setShowOverlapList(false);
            return;
        }

        const delay = setTimeout(() => {
            const idx = Number(selectedDay) - 1;
            const dayId = dayIds[idx];
            checkOverlap(dayId, formStartTime, formDuration, activityId);
        }, 250);
        return () => clearTimeout(delay);
    }, [formStartTime, formDuration, activityId]);

    return (
        <span>
            {overlappingActivities.length > 0 && (
                <div>
                    <p className="overlap-warning">
                        ! This time conflicts with another activity.
                        <button
                            type="button"
                            className="chevron-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleDropdown();
                            }}
                        >
                            {showOverlapList ? <ChevronUp /> : <ChevronDown />}
                        </button>
                    </p>

                    {showOverlapList && (
                        <div>
                            <ul className="overlap-items">
                                {overlappingActivities.map((a) => (
                                    <li key={a.activity_id}>
                                        <strong>{a.activity_name}</strong> ({formatTime(a.activity_startTime)} - {formatTime(calculateEndTime({a}))})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </span>
    );
}