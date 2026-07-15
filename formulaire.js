const formulaire = document.getElementById('formulary');

formulaire.addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(formulaire);

    const datas = Object.fromEntries(formData.entries());

    console.log(datas);
});