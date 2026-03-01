<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['GET']);

$user = api_current_user();

if ($user === null) {
    api_json_response(['authenticated' => false], 401);
}

api_json_response([
    'authenticated' => true,
    'user' => $user,
]);
