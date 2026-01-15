import { 
  PersonAddOutlined, 
  GraphicEqOutlined, 
  Star, 
  CalendarToday, 
  CancelOutlined, 
  AccountBalanceWallet,
  AttachMoney,
  TaskAlt,
  ThumbUp,
  ThumbDown,
  NotificationsActive
} from '@mui/icons-material';
import type { ActivityItem } from '../types/activity';
import type { Notification } from '../api/notificationsService';

/**
 * Format a date to a human-readable relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
}

/**
 * Map notification type to icon, status, and label
 */
function getNotificationMapping(notificationType: string): {
  icon: any;
  status: string;
} {
  switch (notificationType) {
    case 'new_client_added':
      return {
        icon: PersonAddOutlined,
        status: 'connection'
      };
    case 'booking_created':
      return {
        icon: GraphicEqOutlined,
        status: 'booking_created'
      };
    case 'booking_placed':
      return {
        icon: CalendarToday,
        status: 'booking_placed'
      };
    case 'payment_received':
      return {
        icon: AccountBalanceWallet,
        status: 'payment_success'
      };
    case 'payment_required':
      return {
        icon: AttachMoney,
        status: 'payment_required'
      };
    case 'session_completed':
      return {
        icon: TaskAlt,
        status: 'session_completed'
      };
    case 'review_submitted':
      return {
        icon: Star,
        status: 'review'
      };
    case 'booking_approved':
      return {
        icon: ThumbUp,
        status: 'booking_approved'
      };
    case 'booking_rejected':
      return {
        icon: ThumbDown,
        status: 'booking_rejected'
      };
    case 'booking_canceled':
      return {
        icon: CancelOutlined,
        status: 'booking_canceled'
      };
    default:
      return {
        icon: NotificationsActive,
        status: 'default'
      };
  }
}

/**
 * Convert a notification to an ActivityItem
 */
export function notificationToActivityItem(notification: Notification): ActivityItem {
  const mapping = getNotificationMapping(notification.notification_type);
  
  // Extract counterpart name from metadata or message
  let counterpart = 'Unknown';
  
  // For booking notifications, use the related user's display name from metadata
  if (notification.notification_type === 'booking_placed' && notification.metadata?.creative_display_name) {
    counterpart = notification.metadata.creative_display_name;
  } else if (notification.notification_type === 'booking_created' && notification.metadata?.client_display_name) {
    counterpart = notification.metadata.client_display_name;
  } else if (notification.notification_type === 'booking_approved' && notification.metadata?.creative_display_name) {
    counterpart = notification.metadata.creative_display_name;
  } else if (notification.notification_type === 'booking_approved' && notification.metadata?.client_display_name) {
    counterpart = notification.metadata.client_display_name;
  } else if (notification.notification_type === 'payment_received' && notification.metadata?.creative_display_name) {
    counterpart = notification.metadata.creative_display_name;
  } else if (notification.notification_type === 'payment_received' && notification.metadata?.client_display_name) {
    counterpart = notification.metadata.client_display_name;
  } else if (notification.notification_type === 'session_completed' && notification.metadata?.creative_display_name) {
    counterpart = notification.metadata.creative_display_name;
  } else if (notification.notification_type === 'session_completed' && notification.metadata?.client_display_name) {
    counterpart = notification.metadata.client_display_name;
  } else if (notification.notification_type === 'payment_required' && notification.metadata?.creative_display_name) {
    counterpart = notification.metadata.creative_display_name;
  } else if (notification.metadata?.client_display_name) {
    counterpart = notification.metadata.client_display_name;
  } else if (notification.message) {
    // Try to extract name from message (e.g., "John Doe has added you...")
    const match = notification.message.match(/^([^ ]+ [^ ]+)/);
    if (match) {
      counterpart = match[1];
    }
  }

  return {
    id: parseInt(notification.id.replace(/-/g, '').substring(0, 10), 16), // Convert UUID to number
    icon: mapping.icon,
    label: notification.title,
    description: notification.message,
    counterpart: counterpart,
    date: formatRelativeTime(notification.created_at),
    status: mapping.status,
    isNew: !notification.is_read,
    notificationType: notification.notification_type,
    metadata: notification.metadata || {},
    notificationId: notification.id, // Store notification ID for marking as read
    relatedEntityId: notification.related_entity_id // Store related entity ID (e.g., booking_id) for navigation
  };
}

/**
 * Convert an array of notifications to ActivityItems
 */
export function notificationsToActivityItems(notifications: Notification[]): ActivityItem[] {
  return notifications.map(notificationToActivityItem);
}

