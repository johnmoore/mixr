<?php
ob_start("ob_gzhandler");
header('Content-Type: application/json');
$data = file_get_contents('php://input');
$json = json_decode($data);
$idsAndTokens = $json->{'persons'}; // {persons: [{"id":11932418, "token":SADAMadsfjheaDFJ}, {"id":11932418, "token":SADAMadsfjheaDFJ}], {gameid: id}}

//facebook SDK info
define("FB_APP_ID","659591790761064");
define("FB_APP_SECRET","9ab91a92941afac12d290b2122693cf1");

require './facebook-php-sdk/src/facebook.php';
include 'ay-fb-friend-rank.class.php';

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
    $facebook = new Facebook(array(
      'appId'  => FB_APP_ID,
      'secret' => FB_APP_SECRET,
    ));

    $facebook->setAccessToken($FBaccessToken);

    $user = $facebook->getUser();

    if ($user) {
        $selectedFriends[$user] = array();

        $fbRanker = new AyFbFriendRank($facebook);
        $friends = $fbRanker->getFriends();

        //print_r($friends);
        // $allRanks[$user] = $friends;

        $idx = mt_rand(1,4);
        while (count($selectedFriends[$user]) < 10) {
          if (array_key_exists($friends[$idx]["uid"], $allSelectedFriends) || in_array($friends[$idx]["uid"], $usingIds)) {
            
          }
          else {
            $selectedFriends[$user][$friends[$idx]["uid"]] = $friends[$idx]["name"];
            //echo $friends[$idx]["name"] . "\r\n";
            $allSelectedFriends[$friends[$idx]["uid"]] = $friends[$idx]["name"];
            $response = $facebook->api(
              "/".$friends[$idx]["uid"]."/likes/"
            );
            $num_page_likes = count($response["data"]);
            if ($num_page_likes > 0) {
              $selectedFriends[$user][$friends[$idx]["uid"]] = $friends[$idx]["name"].chr(7).$response["data"][mt_rand(0,$num_page_likes-1)]["name"].", ".$response["data"][mt_rand(0,$num_page_likes-1)]["name"].", ".$response["data"][mt_rand(0,$num_page_likes-1)]["name"];            
            }
          }
          $idx += mt_rand(1,3);
        }
    }
    else {
        $result["facebook"]="failed";
        echo json_encode($result);
        die();
    }
}

$selectedFriends['gameid'] = $json->{'gameid'};

echo json_encode($selectedFriends);

?>