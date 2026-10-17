<?php
// backend/app/Controllers/NotificationController.php - FIXED to match ProductController pattern

namespace App\Controllers;

use App\Models\Notification;

class NotificationController
{
    private $notificationModel;

    public function __construct()
    {
        $this->notificationModel = new Notification();
    }

    // GET /notifications?user_id=1&filter=all
    public function fetchNotifications($data = [])
    {
        $userId = $data['user_id'] ?? null;
        $filter = $data['filter'] ?? 'all';

        if (!$userId) {
            return [
                'status' => 'Error',
                'message' => 'user_id required'
            ];
        }

        try {
            // Fetch notifications based on the provided filter
            $notifications = $this->notificationModel->fetchByUser($userId, $filter);

            $unreadCount = 0;
            foreach ($notifications as $n) {
                // Check if is_read is 0, false, or null
                if (isset($n['is_read']) && (int)$n['is_read'] === 0) {
                    $unreadCount++;
                }
            }

            return [
                'status' => 'Success',
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
                'total' => count($notifications)
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'Error',
                'message' => $e->getMessage()
            ];
        }
    }

    // POST /notifications/mark-read
    public function markAsRead($data = [])
    {
        $notificationId = $data['notification_id'] ?? null;
        $userId = $data['user_id'] ?? null;

        if (!$notificationId || !$userId) {
            return [
                'status' => 'Error',
                'message' => 'notification_id and user_id required'
            ];
        }

        try {
            $this->notificationModel->markAsRead($notificationId, $userId);

            return [
                'status' => 'Success',
                'message' => 'Marked as read'
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'Error',
                'message' => $e->getMessage()
            ];
        }
    }

    // POST /notifications/mark-all-read
    public function markAllAsRead($data = [])
    {
        $userId = $data['user_id'] ?? null;

        if (!$userId) {
            return [
                'status' => 'Error',
                'message' => 'user_id required'
            ];
        }

        try {
            $this->notificationModel->markAllAsRead($userId);

            return [
                'status' => 'Success',
                'message' => 'All marked as read'
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'Error',
                'message' => $e->getMessage()
            ];
        }
    }

    // GET /admin/orders-status?admin_user_id=1&status=all
    public function fetchAdminOrdersStatus($data = [])
    {
        $adminUserId = $data['admin_user_id'] ?? null;
        $status = $data['status'] ?? 'all';

        if (!$adminUserId) {
            return [
                'status' => 'Error',
                'message' => 'admin_user_id required'
            ];
        }

        try {
            $orders = $this->notificationModel->fetchAdminOrdersStatus($adminUserId, $status);

            $pending = array_filter($orders, fn($o) => $o['status'] === 'PENDING');
            $accepted = array_filter($orders, fn($o) => $o['status'] === 'ACCEPTED');
            $rejected = array_filter($orders, fn($o) => $o['status'] === 'REJECTED');

            return [
                'status' => 'Success',
                'orders' => array_values($orders),
                'counts' => [
                    'pending' => count($pending),
                    'accepted' => count($accepted),
                    'rejected' => count($rejected),
                    'total' => count($orders)
                ]
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'Error',
                'message' => $e->getMessage()
            ];
        }
    }
}
