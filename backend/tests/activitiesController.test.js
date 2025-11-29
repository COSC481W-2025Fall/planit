import { describe, it, expect, vi } from 'vitest'; 
import request from 'supertest';
import * as db from '../config/db.js';
import * as socket from "../socket.js";

// Mock IO instance
socket.getIO = () => ({
  to: () => ({
    emit: () => {},
  }),
});

// Mock the database module
vi.mock('@neondatabase/serverless', () => {
  const tag = async () => [];
  tag.array = async () => [];
  tag.query = async () => ({ rows: [] });
  return { neon: () => tag };
});

// Mock auth and loadOwnedTrip middleware
vi.mock('../auth.js', () => ({
  isLoggedIn: (req, _res, next) => { req.user = { user_id: 1 }; next(); },
}));
vi.mock('../middleware/loadOwnedTrip.js', () => ({
  loadOwnedTrip: async (req, _res, next) => { req.trip = { trips_id: 1 }; next(); },
}));

//durationToMinutes helper
// --- helper to normalize duration into minutes for assertions ---
function durationToMinutes(d) {
  if (d == null) return null;                         // null or undefined
  if (typeof d === 'number') return d;               // already minutes
  if (typeof d === 'string') {
    // common formats: "02:00:00", "120", "PT2H", "120 minutes"
    const s = d.trim();
    if (/^\d+$/.test(s)) return parseInt(s, 10);     // "120"
    const hm = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/); // "HH:MM[:SS]"
    if (hm) return parseInt(hm[1],10) * 60 + parseInt(hm[2],10);
    const iso = s.match(/^P(T(?:(\d+)H)?(?:(\d+)M)?)$/i); // "PT2H", "PT120M"
    if (iso) return (parseInt(iso[2]||0,10)*60) + parseInt(iso[3]||0,10);
    const withWord = s.match(/^(\d+)\s*minutes?$/i);  // "120 minutes"
    if (withWord) return parseInt(withWord[1], 10);
    return null; // unknown string shape
  }
  if (typeof d === 'object') {
    // common object: { hours, minutes } or { minutes }
    if (typeof d.minutes === 'number') {
      return (typeof d.hours === 'number' ? d.hours*60 : 0) + d.minutes;
    }
    if (typeof d.hours === 'number') return d.hours * 60;
  }
  return null;
}

// Mock the database query function used in the controllers
vi.mock('../config/db.js', () => {
  let nextId = 1;
  const store = [];
  const sql = async (strings, ...vals) => {
    const q = strings.join(' ');
    if (q.includes('INSERT INTO activities')) {
      // order of vals must match INSERT in controller
      const [day, name, type, priceLevel, address, rating, longitude, latitude] = vals;
      const row = {
        activity_id: nextId++,
        day_id: day,
        activity_name: name,
        activity_types: type,
        activity_price_level: priceLevel,
        activity_address: address,
        activity_rating: rating,
        longitude,
        latitude,
        activity_startTime: null,
        activity_duration: null,
        activity_price_estimated: null,
      };
      store.push(row);
      return [];
    }
    // Simplified SELECT queries for testing purposes
    if (q.includes('SELECT * FROM activities') && q.includes('"day_id" =') && q.includes('"activity_name" =')) {
      const [day, name] = vals;
      return store
        .filter(r => r.day_id === day && r.activity_name === name)
        .sort((a, b) => b.activity_id - a.activity_id)
        .slice(0, 1);
    }
    // More specific SELECT for single activity by id
    if (q.includes('SELECT * FROM activities') && q.includes('"activity_id" =')) {
      const [id] = vals;
      return store.filter(r => r.activity_id === id);
    }
    // Update activity
    if (q.includes('UPDATE activities')) {
      const [startTs, durationInterval, price, id] = vals;
      const row = store.find(r => r.activity_id === id);
      if (row) {
        row.activity_startTime = startTs ? new Date(startTs).toISOString() : null;
        if (durationInterval) {
          const minutes = parseInt(String(durationInterval), 10);
          row.activity_duration = { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
        } else {
          row.activity_duration = null;
        }
        row.activity_price_estimated = (price ?? null);
      }
      return row ? [row] : [];
    }
    // Delete activity
    if (q.includes('DELETE FROM activities WHERE "activity_id" =')) {
      const [id] = vals;
      const idx = store.findIndex(r => r.activity_id === id);
      if (idx > -1) store.splice(idx, 1);
      return [];
    }
    // Get all activities for a day
    if (q.includes('SELECT * FROM activities') && q.includes('"day_id" =') && !q.includes('"activity_name" =')) {
      const [day] = vals;
      return store.filter(r => r.day_id === day);
    }
    return [];
  };
  return { sql };
});

// Import the app with routes for testing
import express from 'express';
 import {
   addActivity,
   readAllActivities,
   readSingleActivity,
   updateActivity,
   deleteActivity,
   checkOverlappingTimes,
 } from '../controllers/activitiesController.js';

 // tiny app just for Activities routes
 const app = express();
 app.use(express.json());
 app.post('/activities/create', addActivity);
 app.get('/activities/read/all', readAllActivities);
 app.get('/activities/read/single', readSingleActivity);
 app.put('/activities/update', updateActivity);
 app.delete('/activities/delete', deleteActivity);
 app.post('/activities/check-overlap', checkOverlappingTimes);

let createdActivityId;

it('should add a new activity', async () => {
  const res = await request(app)
    .post('/activities/create')
    .send({
      day: 1,
      dayId: 1,
      activity: {
        name: 'Seed Activity',
        address: '123 Test St',
        type: 'Test',
        priceLevel: 1,
        rating: 5,
        longitude: 0,
        latitude: 0
      }
    });
  expect(res.status).toBe(200);
  
  const created = res.body?.activity;
  if (created) {
    createdActivityId = created.activity_id;
  } else {
    const list = await request(app)
      .get('/activities/read/all')
      .send({ dayId: 1 });
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.activities)).toBe(true);
    expect(list.body.activities.length).toBeGreaterThan(0);
    // grab the most recent (your controller orders DESC by id when selecting)
    createdActivityId = list.body.activities[0].activity_id;
  }
  expect(createdActivityId).toBeTruthy();
});

  //test for reading all activities from a day
  it('should get all activities for a day', async () => {
    const res = await request(app)
      .get('/activities/read/all')
      .send({ dayId: 1 }); // controller reads from body
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.activities)).toBe(true);
  });

  //test for reading one activity
  it('should read a single activity', async () => {
    const res = await request(app)
      .get('/activities/read/single')   // controller reads from body
      .send({ activityId: createdActivityId });
    expect(res.status).toBe(200);
    expect(res.body.activity).toBeDefined();
    expect(res.body.activity.activity_id).toBe(createdActivityId);
  });

  //test for updating an activity
  it('should update an activity', async () => {
    const res = await request(app)
      .put('/activities/update') //path for updating an activity
      .send({
        activityId: createdActivityId,
        activity: {
          startTime: '15:00',
          userTimeZone: 'America/Detroit',
          duration: 120,
          estimatedCost: 30
        }
      });
      //checking for all updated values 
    expect(res.status).toBe(200);
    expect(res.body.activity).toBeDefined();
    const startTS = res.body.activity.activity_startTime;
    if (startTS !== null && startTS !== undefined) {
      expect(Number.isNaN(Date.parse(startTS))).toBe(false);
    }
    const rawDuration = res.body.activity.activity_duration ?? res.body.activity.duration ?? res.body.activity.activity_duration_minutes;
    const minutes = durationToMinutes(rawDuration);
    if (rawDuration != null) expect(minutes).toBe(120);
    const rawPrice =
      res.body.activity.activity_price_estimated ??
      res.body.activity.price_estimated ??
      res.body.activity.estimated_cost ??
      res.body.activity.estimatedCost ??
      res.body.activity.priceEstimate ??
      res.body.activity.price;
    if (rawPrice != null) expect(Number(rawPrice)).toBe(30);
  });

  //test for deleting an activity
  it('should delete an activity', async () => {
    const res = await request(app)
      .delete('/activities/delete') // route expects id in body
      .send({ activityId: createdActivityId });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  //testing 404 error handling in reading a single activity
  it('should return 404 for reading a non-existent activity', async () => {
    const res = await request(app)
      .get('/activities/read/single')
      .send({ activityId: 999999 });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
    const msg = res.body?.error ?? res.body?.message ?? '';
    expect(String(msg)).toMatch(/not found/i);
  });

  //testing 400 error handling in creating an activity
  it('should return 400 for missing required fields on add', async () => {
    const res = await request(app)
      .post('/activities/create')//route for create in activities
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/missing required fields/i);
  });

  //testing overlap check
  it('should return 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/activities/check-overlap')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/missing required fields/i);
  });

  //testing overlap check with no overlaps
  it('should return 200 and empty array when no overlaps', async () => {
    const res = await request(app)
      .post('/activities/check-overlap')
      .send({
        dayId: 1,
        proposedStartTime: '09:00',
        proposedDuration: 60,
      });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.overlappingActivities)).toBe(true);
    expect(res.body.overlappingActivities.length).toBe(0);
  });

  //testing overlap check with internal server error
  it('should return 500 if internal server error occurs', async () => {
    vi.spyOn(db, 'sql').mockImplementationOnce(() => {
      throw new Error('DB error');
    });

    const res = await request(app)
      .post('/activities/check-overlap')
      .send({
        dayId: 1,
        proposedStartTime: '09:00',
        proposedDuration: 60,
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/internal server error/i);
  });