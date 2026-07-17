<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/assets/statistics.css">
    <title>Statistiques</title>
</head>
<body>
<div class="body">
    <?php include "processStats.php"; ?>
    <h1>Analyse des réponses</h1>

    <div class="row">
        <div class="image_boy">
            <?php
            if ($nb_participants == 0) {
                echo 0;
            } else {
                echo round($boy_vote/$nb_participants * 100);
            }
            ?>%</div>
        <div class="case_1">
            <section class="title">Genre</section>
            <progress class="progress-gender" value="<?= $boy_vote ?>" max="<?= $nb_participants ?>"></progress>
        </div>
        <div class="image_girl">
            <?php
            if ($nb_participants == 0) {
                echo 0;
            } else {
                echo round($girl_vote/$nb_participants * 100);
            }
            ?>%</div>
    </div>

    <div class="row">
        <div class="case">
            <section class="title">Signe Astrologique</section>
            <div class="astro-case">
                <section>Scorpion ♏<br><br>Loyauté<br>Courage<br>Passion</section>
                <section>Sagittaire ♐<br><br> Généreux<br>Enthousiaste<br>Franc</section>
            </div>
                <progress value="<?= $scorpion ?>" max="<?= $nb_participants?>"></progress>
                <section class="astro-pourcentage">
                    <p><?php
                    if ($nb_participants == 0) {
                        echo 0;
                    } else {
                        echo round($scorpion/$nb_participants * 100);
                    }
                    ?>%</p>
                    <p><?php
                    if ($nb_participants == 0) {
                        echo 0;
                    } else {
                        echo round($sagittaire/$nb_participants * 100);
                    }
                    ?>%</p>
                </section>
        </div>
        <div class="case">
            <section class="title">Couleur des Yeux</section>
                <div class="chart-content">
                    <div class="legend">
                        <div class="legend-item"><div class="legend-color green"></div> Verts</div>
                        <div class="legend-item"><div class="legend-color blue"></div> Bleus</div>
                        <div class="legend-item"><div class="legend-color brown"></div> Bruns</div>
                    </div>
                    <div class="chart-container"
                        style="background: conic-gradient(
                            #809989 0% <?= $pourcentage_green ?>%,
                            #a9c5de <?= $pourcentage_green ?>% <?= $pourcentage_blue + $pourcentage_green?>%,
                            #d69e71 <?= $pourcentage_blue + $pourcentage_green?>% 100%
                        );">
                        <div class="center-label"></div>
                    </div>
                </div>
        </div>
    </div>

    <div class="row">
        <div class="case_job">
            <table class="job">
                <section class="title-1">Plus tard, je serai...</section>
                <br><small>Version GN</small>
                <thead>
                    <tr>
                        <th></th>
                        <th scope="col">Humain</th>
                        <th scope="col">Elfe</th>
                        <th scope="col">Nain</th>
                        <th scope="col">Orc</th>
                        <th scope="col">Hobbit</th>
                        <th scope="col">Draconien</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    foreach ($personnage as $classe => $race) {
                        echo "<tr>";
                        echo "<th scope='row'>$classe</th>";
                        foreach ($race as $value) {
                            if ($value == 0) {
                                echo "<td></td>";
                            } else {
                                echo "<td>$value</td>";
                            }
                        }
                        echo "</tr>";
                    }
                    ?>
            </table>
        </div>
        <div class="case_personnality">
            <section class="title">Personnalité</section>
            <ul>
                <?php
                foreach ($personnalities as $personnality => $nb_votes) {
                    if ( $nb_votes > 0 ) {
                        echo "<li>$personnality ($nb_votes)</li>";
                    }
                }
                ?>
            </ul>
        </div>
    </div>
    <footer>Nombre de participants: <?=$nb_participants?></footer>
</div>
</body>
</html>