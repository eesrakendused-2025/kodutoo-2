<?php
if (isset($_POST['save'])) {
    $data = $_POST['save'];
    
    // Convert to JSON
    $jsonData = json_encode([
        'content' => $data
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    // Save to file
    file_put_contents('database.txt', $jsonData);

    echo "Salvestatud!";
} else {
    echo "Andmeid ei saadetud.";
}
?>
