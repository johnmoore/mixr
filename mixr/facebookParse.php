<?php
ob_start("ob_gzhandler");
header('Content-Type: application/json');
$data = file_get_contents('php://input');
$json = json_decode($data);
$idsAndTokens = $json->{'persons'}; // {persons: [{"id":11932418, "token":SADAMadsfjheaDFJ}, {"id":11932418, "token":SADAMadsfjheaDFJ}], {gameid: id}}
$gender_pref = $json->{'gender'};
if ($gender_pref != 1 && $gender_pref != 2) {
  $gender_pref = 0;
}
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
            if ($gender_pref == 1) {
              if ($friends[$idx]["sex"] == "male") {
                goto add;
              }
            }
            else if ($gender_pref == 2) {
              if ($friends[$idx]["sex"] == "female") {
                goto add;
              }
            }
            else {
              add:
              $selectedFriends[$user][$friends[$idx]["uid"]] = $friends[$idx]["name"];
              //echo $friends[$idx]["name"] . "\r\n";
              $allSelectedFriends[$friends[$idx]["uid"]] = $friends[$idx]["name"];
              $response = $facebook->api(
                "/".$friends[$idx]["uid"]."/likes/"
              );
              $num_page_likes = count($response["data"]);
              $selectedFriends[$user][$friends[$idx]["uid"]] = $friends[$idx]["name"].chr(7);  
              if ($num_page_likes > 0) {
                $like_idx = 0;
                $num_likes = 0;
                while ($num_likes < 3 && $like_idx < $num_page_likes) {          
                  $like_idx += 1;
                  $page_like = $response["data"][mt_rand(0,$num_page_likes-1)];
                  //print_r($page_like['category']);
                  if ($page_like['category'] = "Band" ||
                    $page_like['category'] = "Film" ||
                    $page_like['category'] = "TV Programme" ||
                    $page_like['category'] = "Museum/attraction" ||
                    $page_like['category'] = "Café" ||
                    $page_like['category'] = "Game" ||
                    $page_like['category'] = "Actor" ||
                    $page_like['category'] = "Public figure" ||
                    $page_like['category'] = "Club" ||
                    $page_like['category'] = "Musician") {
                    $selectedFriends[$user][$friends[$idx]["uid"]] = $selectedFriends[$user][$friends[$idx]["uid"]].$page_like['name'].chr(7);
                    $num_likes += 1;
                  }
                }
              }
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