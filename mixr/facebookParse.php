<?php
ob_start("ob_gzhandler");
header('Content-Type: application/json');
$data = file_get_contents('php://input');
$json = json_decode($data);
$idsAndTokens = $json; // [{"id":11932418, "token":SADAMadsfjheaDFJ}, {"id":11932418, "token":SADAMadsfjheaDFJ}]

//facebook SDK info
define("FB_APP_ID","659591790761064");
define("FB_APP_SECRET","9ab91a92941afac12d290b2122693cf1");

require './facebook-php-sdk/src/facebook.php';
include 'ay-fb-friend-rank.class.php';

$facebook = new Facebook(array(
    'appId'  => FB_APP_ID,
    'secret' => FB_APP_SECRET,
));

$usingIds = array();

$selectedFriends = array();
$allSelectedFriends = array();
$allRanks = array();

//store the IDs of the people using the app
for ($i = 0; $i < count($idsAndTokens); $i++) {
  array_push($usingIds, $idsAndTokens[$i]->{"id"});
}

for ($i = 0; $i < count($idsAndTokens); $i++) {
    $FBaccessToken = $idsAndTokens[$i]->{"token"};

    //echo $FBaccessToken . "\r\n";

    $facebook->setAccessToken($FBaccessToken);

    $user = $facebook->getUser();

    if ($user) {
        $selectedFriends[$user] = array();

        $fbRanker = new AyFbFriendRank($facebook);
        $friends = $fbRanker->getFriends();

        // $allRanks[$user] = $friends;

        $idx = 0;
        while (count($selectedFriends[$user]) < 10) {
          if (array_search($friends[$idx]["uid"], $allSelectedFriends) && array_search($friends[$idx]["uid"], $usingIds)) {
            
          }
          else {
            array_push($selectedFriends[$user], $friends[$idx]["uid"]);
            array_push($allSelectedFriends, $friends[$idx]["uid"]);
          }
          $idx += 1;
        }
    }
    else {
        $result["facebook"]="failed";
        echo json_encode($result);
        die();
    }
}

print_r($selectedFriends);

?>