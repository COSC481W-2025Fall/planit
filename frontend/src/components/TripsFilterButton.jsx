import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function TripsFilterButton({
  sortOption,
  setSortOption,
  dateFilter,
  setDateFilter,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateChange = (value) => {
    setDateFilter(value);
    setIsOpen(false);
  };

  const handleSortChange = (value) => {
    setSortOption(value);
    setIsOpen(false);
  };

  return (
    <div className={`filter-wrapper ${className}`} ref={wrapperRef}>
      <button
        type="button"
        className="filter-button"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="filter-icon"></span> Filter
        <ChevronDown
          size={16}
          className={`filter-chevron ${isOpen ? "open" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="trip-dropdown filter-dropdown">
          <div className="filter-section-label">Show</div>
          <button
            type="button"
            className={`dropdown-item ${
              dateFilter === "all" ? "active" : ""
            }`}
            onClick={() => handleDateChange("all")}
          >
            All trips
          </button>
          <button
            type="button"
            className={`dropdown-item ${
              dateFilter === "upcoming" ? "active" : ""
            }`}
            onClick={() => handleDateChange("upcoming")}
          >
            Upcoming trips
          </button>
          <button
            type="button"
            className={`dropdown-item ${
              dateFilter === "past" ? "active" : ""
            }`}
            onClick={() => handleDateChange("past")}
          >
            Past trips
          </button>

          <div className="filter-divider"></div>

          <div className="filter-section-label">Sort by</div>
          <button
            type="button"
            className={`dropdown-item ${
              sortOption === "earliest" ? "active" : ""
            }`}
            onClick={() => handleSortChange("earliest")}
          >
            Earliest start date
          </button>
          <button
            type="button"
            className={`dropdown-item ${
              sortOption === "oldest" ? "active" : ""
            }`}
            onClick={() => handleSortChange("oldest")}
          >
            Oldest start date
          </button>
          <button
            type="button"
            className={`dropdown-item ${sortOption === "az" ? "active" : ""}`}
            onClick={() => handleSortChange("az")}
          >
            Name (A–Z)
          </button>
          <button
            type="button"
            className={`dropdown-item ${sortOption === "za" ? "active" : ""}`}
            onClick={() => handleSortChange("za")}
          >
            Name (Z–A)
          </button>
          <button
            type="button"
            className={`dropdown-item ${
              sortOption === "location" ? "active" : ""
            }`}
            onClick={() => handleSortChange("location")}
          >
            Location (A–Z)
          </button>
          <button
            type="button"
            className={`dropdown-item ${
              sortOption === "recent" ? "active" : ""
            }`}
            onClick={() => handleSortChange("recent")}
          >
            Most recently edited
          </button>
        </div>
      )}
    </div>
  );
}
