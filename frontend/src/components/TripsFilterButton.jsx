import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Mountain, Smile, Briefcase, Theater, Leaf, Utensils, Moon, Users, Heart, } from "lucide-react";

export default function TripsFilterButton({
  sortOption,
  setSortOption,
  dateFilter,
  setDateFilter,
  categoryFilter,
  setCategoryFilter,
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
            Upcoming & current
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

          <div className="filter-section-label">Categories</div>

          <button
            type="button"
            className={`dropdown-item ${categoryFilter === "all" ? "active" : ""
              }`}
            onClick={() => setCategoryFilter("all")}
          >
            All categories
          </button>

          <button
            type="button"
            className={`dropdown-item ${categoryFilter === "adventure" ? "active" : ""
              }`}
            onClick={() => setCategoryFilter("adventure")}
          >
            <Mountain size={16} style={{ marginRight: 6 }} />
            Adventure
          </button>

          <button
            type="button"
            className={`dropdown-item ${categoryFilter === "relaxation" ? "active" : ""
              }`}
            onClick={() => setCategoryFilter("relaxation")}
          >
            <Smile size={16} style={{ marginRight: 6 }} />
            Relaxation
          </button>

          <button
            type="button"
            className={`dropdown-item ${categoryFilter === "business" ? "active" : ""
              }`}
            onClick={() => setCategoryFilter("business")}
          >
            <Briefcase size={16} style={{ marginRight: 6 }} />
            Business
          </button>

          <button
            type="button"
            className={`dropdown-item ${categoryFilter === "cultural" ? "active" : ""
              }`}
            onClick={() => setCategoryFilter("cultural")}
          >
            <Theater size={16} style={{ marginRight: 6 }} />
            Cultural
          </button>

          <button
            type="button"
            className={`dropdown-item ${categoryFilter === "nature" ? "active" : ""
              }`}
            onClick={() => setCategoryFilter("nature")}
          >
            <Leaf size={16} style={{ marginRight: 6 }} />
            Nature
          </button>

          <button
            type="button"
            className={`dropdown-item ${categoryFilter === "food" ? "active" : ""
              }`}
            onClick={() => setCategoryFilter("food")}
          >
            <Utensils size={16} style={{ marginRight: 6 }} />
            Food
          </button>

          <button
            type="button"
            className={`dropdown-item ${categoryFilter === "nightlife" ? "active" : ""
              }`}
            onClick={() => setCategoryFilter("nightlife")}
          >
            <Moon size={16} style={{ marginRight: 6 }} />
            Nightlife
          </button>

          <button
            type="button"
            className={`dropdown-item ${categoryFilter === "family" ? "active" : ""
              }`}
            onClick={() => setCategoryFilter("family")}
          >
            <Users size={16} style={{ marginRight: 6 }} />
            Family
          </button>

          <button
            type="button"
            className={`dropdown-item ${categoryFilter === "romantic" ? "active" : ""
              }`}
            onClick={() => setCategoryFilter("romantic")}
          >
            <Heart size={16} style={{ marginRight: 6 }} />
            Romantic
          </button>

          <div className="filter-divider"></div>

          <div className="filter-section-label">Sort by</div>
          <button
            type="button"
            className={`dropdown-item ${
              sortOption === "recent" ? "active" : ""
            }`}
            onClick={() => handleSortChange("recent")}
          >
            Recently edited
          </button>
          <button
            type="button"
            className={`dropdown-item ${
              sortOption === "earliest" ? "active" : ""
            }`}
            onClick={() => handleSortChange("earliest")}
          >
            Start date (soonest)
          </button>
          <button
            type="button"
            className={`dropdown-item ${
              sortOption === "oldest" ? "active" : ""
            }`}
            onClick={() => handleSortChange("oldest")}
          >
            Start date (furthest)
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
        </div>
      )}
    </div>
  );
}
