<?php

$dossier = 'participants/';
$fichiers = glob($dossier . '*.json');

$nb_participants = 0;

$girl_vote = 0;
$boy_vote = 0;

$blue_eyes = 0;
$green_eyes = 0;
$brown_eyes = 0;

$scorpion = 0;
$sagittaire = 0;

$personnalities = [
    "Câlin" => 0,
    "Têtu" => 0,
    "Rêveur" => 0,
    "Malicieux" => 0,
    "Joueur" => 0,
    "Calme" => 0,
    "Curieux" => 0,
    "Sensible" => 0
];

$personnage = [
    "Paladin" => [0, 0, 0, 0, 0, 0],
    "Barde" => [0, 0, 0, 0, 0, 0],
    "Sorcier" => [0, 0, 0, 0, 0, 0],
    "Druide" => [0, 0, 0, 0, 0, 0],
    "Pirate" => [0, 0, 0, 0, 0, 0],
    "Noble" => [0, 0, 0, 0, 0, 0],
    "Guerrier" => [0, 0, 0, 0, 0, 0],
    "Soigneur" => [0, 0, 0, 0, 0, 0]
];

$classes = [
    "Humain" => 0,
    "Elfe" => 1,
    "Nain" => 2,
    "Orc" => 3,
    "Hobbit" => 4,
    "Draconien" => 5
];


foreach ($fichiers as $fichier) {
    $nb_participants += 1;

    $contenuJson = file_get_contents($fichier);
    $donnees = json_decode($contenuJson, true);
    if ( $donnees["gender"] == "girl" ) {
        $girl_vote += 1;
    }
    elseif ( $donnees["gender"] == "boy" ) {
        $boy_vote += 1;
    }

    if ( $donnees["eyes"] == "green" ) {
        $green_eyes += 1;
    } elseif ( $donnees["eyes"] == "blue" ) {
        $blue_eyes += 1;
    } elseif ( $donnees["eyes"] == "brown" ) {
        $brown_eyes += 1;
    }

    $date = DateTime::createFromFormat('Y-m-d', $donnees["day"]);
    if ( $date->format('m') == 10 && $date->format('d') >= 23 || $date->format('m') == 11 && $date->format('d') <= 21 ) {
        $scorpion += 1;
    } elseif ( ($date->format('m') == 11 && $date->format('d') >= 22) || ($date->format('m') == 12 && $date->format('d') <= 21) ) {
        $sagittaire += 1;
    }
    $personnalities[$donnees["personnality"]] += 1;
    $personnage[$donnees["classe"]][$classes[$donnees["race"]]] += 1;
}

if ( $nb_participants == 0 ) {
    $pourcentage_green = 0;
    $pourcentage_blue = 0;
    $pourcentage_brown = 0;
} else {
    $pourcentage_green = $green_eyes / $nb_participants * 100;
    $pourcentage_blue = $blue_eyes / $nb_participants * 100;
    $pourcentage_brown = $brown_eyes / $nb_participants;
}

?>