import { describe, it, expect, vi } from 'vitest';
import { readAllImages, readOneImage } from '../controllers/imageController.js';
import { v2 as cloudinary } from 'cloudinary';
import { sql } from "../config/db.js";

// Mock DB
vi.mock("../config/db.js", () => ({
  sql: vi.fn(),
}));

// Mock Cloudinary
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    url: vi.fn(),
  },
}));

describe('Image endpoints', () => {

  // Manually mock the request and response objects
  const createMockRequest = (query = {}, body = {}) => ({
    query,
    body,
  });

  const createMockResponse = () => {
    const res = {};
    res.statusCode = 200;
    res._data = null;
    res.json = (data) => {
      res._data = data;
      return res;
    };
    res.status = (statusCode) => {
      res.statusCode = statusCode;
      return res;
    };
    res._getData = () => res._data;
    return res;
  };

  // Test for readAllImages function
  describe('readAllImages', () => {
    it('should retrieve all images and return them in the correct format', async () => {
      // Mock data returned by SQL query
      const mockSqlResult = [
        { image_id: 1, image_name: 'image1', public_id: 'public_id_1' },
        { image_id: 2, image_name: 'image2', public_id: 'public_id_2' },
      ];

      // Mock Cloudinary URL function
      const mockCloudinaryUrl = 'https://res.cloudinary.com/yourcloud/image/upload/w_200,h_200,c_fill/public_id_1';
      cloudinary.url.mockImplementation((public_id) => mockCloudinaryUrl.replace('public_id_1', public_id));

      sql.mockResolvedValue(mockSqlResult);

      // Create mock request and response objects
      const req = createMockRequest();
      const res = createMockResponse();

      await readAllImages(req, res);

      // Check the response status and body
      expect(res.statusCode).toBe(200);
      expect(res._getData()).toEqual([
        {
          image_id: 1,
          image_name: 'image1',
          imageUrl: mockCloudinaryUrl.replace('public_id_1', 'public_id_1'),
        },
        {
          image_id: 2,
          image_name: 'image2',
          imageUrl: mockCloudinaryUrl.replace('public_id_1', 'public_id_2'),
        },
      ]);
    });

    it('should handle errors gracefully', async () => {
      // Mock SQL error
      sql.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest();
      const res = createMockResponse();

      await readAllImages(req, res);

      expect(res.statusCode).toBe(500);
      expect(res._getData()).toEqual({ error: 'Internal Server Error' });
    });
  });

  // Test for readOneImage function
  describe('readOneImage', () => {
    it('should retrieve a specific image by ID and return the image URL', async () => {
      // Mock image ID and SQL result
      const imageId = 1;
      const mockSqlResult = [{ public_id: 'public_id_1' }];

      const mockCloudinaryUrl = 'https://res.cloudinary.com/yourcloud/image/upload/secure/public_id_1';
      cloudinary.url.mockImplementation((public_id) => mockCloudinaryUrl.replace('public_id_1', public_id));

      sql.mockResolvedValue(mockSqlResult);

      const req = createMockRequest({ imageId });
      const res = createMockResponse();

      await readOneImage(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getData()).toEqual({ imageUrl: mockCloudinaryUrl.replace('public_id_1', 'public_id_1') });
    });

    it('should return 404 if the image is not found', async () => {
      const imageId = 1;
      const mockSqlResult = [];

      sql.mockResolvedValue(mockSqlResult);

      const req = createMockRequest({ imageId });
      const res = createMockResponse();

      await readOneImage(req, res);

      expect(res.statusCode).toBe(404);
      expect(res._getData()).toEqual({ error: 'Image not found' });
    });

    it('should handle errors gracefully', async () => {
      sql.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest();
      const res = createMockResponse();

      await readOneImage(req, res);

      expect(res.statusCode).toBe(500);
      expect(res._getData()).toEqual({ error: 'Internal Server Error' });
    });
  });
});