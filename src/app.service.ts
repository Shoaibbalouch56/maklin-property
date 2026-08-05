import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot() {
    return {
      name: 'Maklin Admin API',
      message: 'Property management API for Maklin real estate',
      docs: '/api',
      public: {
        listProperties: 'GET /properties',
        getProperty: 'GET /properties/:id',
        createSubmission: 'POST /submissions',
      },
      admin: {
        create: 'POST /properties',
        update: 'PUT /properties/:id',
        delete: 'DELETE /properties/:id',
        stats: 'GET /properties/admin/stats',
        listSubmissions: 'GET /admin/submissions',
        updateSubmissionStatus: 'PATCH /admin/submissions/:id/status',
        deleteSubmission: 'DELETE /admin/submissions/:id',
        header: 'x-admin-secret',
      },
    };
  }
}
