import * as dbHandler from '../utils/dbHandler.js';
import User from '../../src/models/User.js';
import Patient from '../../src/models/patient.js';
import MedicalFile from '../../src/models/medicalFile.js';
import { uploadMedicalFile } from '../../src/controllers/filesController.js';

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('Files controller', () => {
  it('should persist uploaded file metadata for the authenticated patient', async () => {
    const user = await User.create({
      name: 'Test Patient',
      email: 'patient@test.com',
      passwordHash: 'hashed-password',
      role: 'patient'
    });

    const patient = await Patient.create({
      user: user._id,
      dob: new Date('1990-01-01'),
      gender: 'female'
    });

    const req = {
      user: { id: user._id, role: 'patient' },
      file: {
        originalname: 'scan.jpg',
        filename: 'scan_1710000000000.jpg',
        path: '/tmp/scan_1710000000000.jpg',
        size: 1200,
        mimetype: 'image/jpeg'
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    await uploadMedicalFile(req, res);

    const savedFile = await MedicalFile.findOne({ patient: patient._id });
    expect(savedFile).toBeTruthy();
    expect(savedFile.originalName).toBe('scan.jpg');
    expect(savedFile.filename).toBe('scan_1710000000000.jpg');
    expect(savedFile.size).toBe(1200);
    expect(savedFile.mimeType).toBe('image/jpeg');
  });
});
