<?php
//facebook SDK info
define("FB_APP_ID","547602621990585");
define("FB_APP_SECRET","a75219fc43743249eb8569b595b84fb6");

require './facebook-php-sdk/src/facebook.php';
include_once './config.php';

$config = array(
  'appId' => 'YOUR_APP_ID',
  'secret' => 'YOUR_APP_SECRET',
  'fileUpload' => false, // optional
  'allowSignedRequest' => false, // optional, but should be set to false for non-canvas apps
);

$facebook = new Facebook($config);

?>