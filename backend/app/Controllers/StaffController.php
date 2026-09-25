<?php
<<<<<<< HEAD
// manage staff profiles and staff accounts.
=======

namespace App\Controllers;

use App\Models\Staff;
use Exception;

class StaffController
{
    private $staffModel;

    public function __construct()
    {
        $this->staffModel = new Staff();
    }

    private function sendJson(array $data, int $code = 200): void
    {
        http_response_code($code);
        echo json_encode($data);
        exit;
    }

    public function fetchStaffs(): void
    {
        try {
            $input = json_decode(file_get_contents("php://input"), true) ?? [];
            $search = trim($input['search'] ?? $_GET['search'] ?? '');
            $staffs = $this->staffModel->fetchStaffs($search);
            $this->sendJson([
                "status" => "Success",
                "data" => $staffs,
                "count" => count($staffs)
            ], 200);
        } catch (Exception $e) {
            $this->sendJson(["status" => "Error", "message" => $e->getMessage()], 500);
        }
    }

    public function getStaff(): void
    {
        try {
            $input = json_decode(file_get_contents("php://input"), true) ?? [];
            $staffId = $input['staff_id'] ?? $_GET['staff_id'] ?? null;
            if (!$staffId) {
                $this->sendJson(["status" => "Error", "message" => "Staff ID required"], 400);
            }
            $staff = $this->staffModel->getStaffById((int)$staffId);
            if (!$staff) {
                $this->sendJson(["status" => "Error", "message" => "Staff not found"], 404);
            }
            $this->sendJson(["status" => "Success", "data" => $staff], 200);
        } catch (Exception $e) {
            $this->sendJson(["status" => "Error", "message" => $e->getMessage()], 500);
        }
    }

    public function getRoles(): void
    {
        try {
            $roles = $this->staffModel->getStaffRoles();
            $this->sendJson(["status" => "Success", "data" => $roles], 200);
        } catch (Exception $e) {
            $this->sendJson(["status" => "Error", "message" => $e->getMessage()], 500);
        }
    }

    public function deleteStaff(): void
    {
        try {
            $staffId = (int) ($_GET['staff_id'] ?? 0);

            if ($staffId <= 0) {
                $this->sendJson([
                    "status" => "Error",
                    "message" => "A valid staff ID is required"
                ], 400);
            }

            $deleted = $this->staffModel->deleteStaff($staffId);

            if (!$deleted) {
                $this->sendJson([
                    "status" => "Error",
                    "message" => "Staff member was not found or already deleted"
                ], 404);
            }

            $this->sendJson([
                "status" => "Success",
                "message" => "Staff member deleted successfully"
            ], 200);
        } catch (Exception $e) {
            $this->sendJson([
                "status" => "Error",
                "message" => $e->getMessage()
            ], 500);
        }
    }

    public function updateStaff(array $input): void
    {
        try {
            $staff = $this->staffModel->updateStaff($input);
            $this->sendJson([
                "status" => "Success",
                "message" => "Staff updated successfully",
                "data" => $staff
            ], 200);
        } catch (Exception $e) {
            $message = $e->getMessage();
            $code = str_contains($message, "already exists") ? 409 : 400;
            $this->sendJson([
                "status" => "Error",
                "message" => $message
            ], $code);
        }
    }

    public function addStaff(): void
    {
        try {
            $input = json_decode(file_get_contents("php://input"), true);
            if (!$input) {
                $this->sendJson(["status" => "Error", "message" => "Invalid input"], 400);
            }
            $newStaff = $this->staffModel->createStaff($input);
            $this->sendJson([
                "status" => "Success",
                "message" => "Staff created successfully",
                "data" => $newStaff
            ], 201);
        } catch (Exception $e) {
            $msg = $e->getMessage();
            $code = 500;
            if (str_contains($msg, "already exists") || str_contains($msg, "required") || str_contains($msg, "Invalid") || str_contains($msg, "must be")) {
                $code = 400;
            }
            if (str_contains($msg, "already exists")) $code = 409;
            $this->sendJson(["status" => "Error", "message" => $msg], $code);
        }
    }
}

>>>>>>> 5544821 (staff Manager)
