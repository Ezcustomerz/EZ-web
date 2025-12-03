export interface ActivityItem {
  id?: number;
  icon?: any; // MUI icon component
  label: string; // title of the activity
  description?: string; // secondary line
  counterpart: string; // client name on creative side, creative name on client side
  date: string; // human readable time e.g., '2 days ago'
  status: string; // e.g., 'completed' | 'payment' | 'waiting' | 'review'
  isNew?: boolean;
  notificationType?: string; // notification type for special rendering
  metadata?: Record<string, any>; // metadata for highlighting specific text
  notificationId?: string; // notification ID for marking as read
  relatedEntityId?: string; // related entity ID (e.g., booking_id) for navigation
}

