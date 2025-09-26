const { db } = require('../../config/firebase');
const { v4: uuidv4 } = require('uuid');

class SOSAlert {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.alertId = data.alertId || `ALERT${Date.now()}`;
    this.reporterId = data.reporterId || '';
    this.reporterType = data.reporterType || 'passenger'; // passenger | driver | conductor | admin
    this.busId = data.busId || null;
    this.routeId = data.routeId || null;
    this.location = data.location || {
      lat: data.lat || data.latitude || 0,
      lng: data.lng || data.longitude || 0,
      address: data.address || ''
    };
    this.alertType = data.alertType || 'other'; // medical | security | accident | breakdown | harassment | other
    this.severity = data.severity || 'medium'; // low | medium | high | critical
    this.status = data.status || 'open'; // open | acknowledged | in-progress | resolved | false-alarm
    this.description = data.description || '';
    this.emergencyContacts = data.emergencyContacts || [];
    this.assignedOfficerId = data.assignedOfficerId || null;
    this.responseTime = data.responseTime || null; // in minutes
    this.resolutionTime = data.resolutionTime || null; // in minutes
    this.attachments = data.attachments || [];
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.acknowledgedAt = data.acknowledgedAt || null;
    this.resolvedAt = data.resolvedAt || null;
    this.followUpRequired = data.followUpRequired !== undefined ? data.followUpRequired : false;
    this.escalationLevel = data.escalationLevel || 0; // 0-5
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = new Date();
  }

  // Save SOS alert to database
  async save() {
    try {
      await db.collection('sosAlerts').doc(this.id).set(this.toJSON());
      console.log(`✅ SOS Alert ${this.alertId} saved successfully`);
    } catch (error) {
      console.error('Error saving SOS alert:', error);
      throw error;
    }
  }

  // Find SOS alert by ID
  static async findById(id) {
    try {
      const doc = await db.collection('sosAlerts').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return new SOSAlert({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Error finding SOS alert by ID:', error);
      throw error;
    }
  }

  // Find SOS alert by alertId
  static async findByAlertId(alertId) {
    try {
      const snapshot = await db.collection('sosAlerts')
        .where('alertId', '==', alertId)
        .limit(1)
        .get();
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return new SOSAlert({ id: doc.id, ...doc.data() });
    } catch (error) {
      console.error('Error finding SOS alert by alertId:', error);
      throw error;
    }
  }

  // Get all SOS alerts
  static async getAllAlerts(status = null, severity = null) {
    try {
      let query = db.collection('sosAlerts').where('isActive', '==', true);
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      if (severity) {
        query = query.where('severity', '==', severity);
      }
      
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      
      return snapshot.docs.map(doc => new SOSAlert({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting SOS alerts:', error);
      throw error;
    }
  }

  // Get SOS alerts by bus
  static async getByBus(busId) {
    try {
      const snapshot = await db.collection('sosAlerts')
        .where('busId', '==', busId)
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => new SOSAlert({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting SOS alerts by bus:', error);
      throw error;
    }
  }

  // Get SOS alerts by route
  static async getByRoute(routeId) {
    try {
      const snapshot = await db.collection('sosAlerts')
        .where('routeId', '==', routeId)
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => new SOSAlert({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting SOS alerts by route:', error);
      throw error;
    }
  }

  // Get open/critical alerts
  static async getCriticalAlerts() {
    try {
      const snapshot = await db.collection('sosAlerts')
        .where('isActive', '==', true)
        .where('status', 'in', ['open', 'acknowledged', 'in-progress'])
        .where('severity', 'in', ['high', 'critical'])
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => new SOSAlert({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting critical alerts:', error);
      throw error;
    }
  }

  // Acknowledge alert
  async acknowledge(officerId) {
    try {
      this.status = 'acknowledged';
      this.assignedOfficerId = officerId;
      this.acknowledgedAt = new Date();
      this.updatedAt = new Date();
      
      // Calculate response time
      this.responseTime = Math.round((this.acknowledgedAt - this.createdAt) / (1000 * 60)); // minutes

      await db.collection('sosAlerts').doc(this.id).update({
        status: this.status,
        assignedOfficerId: this.assignedOfficerId,
        acknowledgedAt: this.acknowledgedAt,
        responseTime: this.responseTime,
        updatedAt: this.updatedAt
      });

      console.log(`✅ SOS Alert ${this.alertId} acknowledged by ${officerId}`);
    } catch (error) {
      console.error('Error acknowledging SOS alert:', error);
      throw error;
    }
  }

  // Resolve alert
  async resolve(resolution) {
    try {
      this.status = 'resolved';
      this.resolvedAt = new Date();
      this.updatedAt = new Date();
      
      // Calculate resolution time
      this.resolutionTime = Math.round((this.resolvedAt - this.createdAt) / (1000 * 60)); // minutes

      const updateData = {
        status: this.status,
        resolvedAt: this.resolvedAt,
        resolutionTime: this.resolutionTime,
        updatedAt: this.updatedAt
      };

      if (resolution) {
        updateData.resolution = resolution;
      }

      await db.collection('sosAlerts').doc(this.id).update(updateData);

      console.log(`✅ SOS Alert ${this.alertId} resolved`);
    } catch (error) {
      console.error('Error resolving SOS alert:', error);
      throw error;
    }
  }

  // Update status
  async updateStatus(newStatus) {
    try {
      this.status = newStatus;
      this.updatedAt = new Date();

      await db.collection('sosAlerts').doc(this.id).update({
        status: this.status,
        updatedAt: this.updatedAt
      });

      console.log(`✅ SOS Alert ${this.alertId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating SOS alert status:', error);
      throw error;
    }
  }

  // Add attachment
  async addAttachment(attachment) {
    try {
      this.attachments.push({
        ...attachment,
        timestamp: new Date()
      });
      this.updatedAt = new Date();

      await db.collection('sosAlerts').doc(this.id).update({
        attachments: this.attachments,
        updatedAt: this.updatedAt
      });

      console.log(`✅ Attachment added to SOS Alert ${this.alertId}`);
    } catch (error) {
      console.error('Error adding attachment:', error);
      throw error;
    }
  }

  // Check if alert needs escalation
  needsEscalation() {
    const now = new Date();
    const alertAge = (now - this.createdAt) / (1000 * 60); // minutes
    
    if (this.severity === 'critical' && alertAge > 5 && this.status === 'open') {
      return true;
    }
    
    if (this.severity === 'high' && alertAge > 15 && this.status === 'open') {
      return true;
    }
    
    if (alertAge > 60 && this.status !== 'resolved') {
      return true;
    }

    return false;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      alertId: this.alertId,
      reporterId: this.reporterId,
      reporterType: this.reporterType,
      busId: this.busId,
      routeId: this.routeId,
      location: this.location,
      alertType: this.alertType,
      severity: this.severity,
      status: this.status,
      description: this.description,
      emergencyContacts: this.emergencyContacts,
      assignedOfficerId: this.assignedOfficerId,
      responseTime: this.responseTime,
      resolutionTime: this.resolutionTime,
      attachments: this.attachments,
      isActive: this.isActive,
      acknowledgedAt: this.acknowledgedAt,
      resolvedAt: this.resolvedAt,
      followUpRequired: this.followUpRequired,
      escalationLevel: this.escalationLevel,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Get public data (for API responses)
  toPublicJSON() {
    return {
      id: this.id,
      alertId: this.alertId,
      alertType: this.alertType,
      severity: this.severity,
      status: this.status,
      location: this.location,
      createdAt: this.createdAt,
      responseTime: this.responseTime
    };
  }
}

module.exports = SOSAlert;