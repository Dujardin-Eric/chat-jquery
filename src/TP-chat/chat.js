$(document).ready(function(){

    // URL de l'API
    const URL = "https://fast-reaches-82309.herokuapp.com/";

    // Les variables de l'état de l'application
    var currentUser = {};
    var activeRoom = {};

    // Fonctions de test de l'état

    /**
     *  L'utilisateur est connecté si :
     * - l'objet currentUser possède une clé id
     * - cet id n'est pas vide (null, undefined ou 0)
     * @returns boolean
     */
    function isUserConnected(){
        return "id" in currentUser && currentUser.id;
    }

    /**
     *  Le salon est séléctionné si :
     * - l'objet activeRoom possède une clé id
     * - cet id n'est pas vide (null, undefined ou 0)
     * @returns boolean
     */
    function isRoomSelected(){
        return "id" in activeRoom && activeRoom.id;
    }

    // Cibles du DOM de l'application
    const $loginModal = $("#loginModal");
    const $loginForm = $("#loginForm");
    const $registerModal = $("#registerModal");
    const $registerForm = $("#registerForm");
    const $messageForm = $("#messageForm");
    const $roomForm = $("#roomForm");
    const $userInfos = $("#userInfos");
    const $alert = $("#alert");
    const $roomContainer = $("#roomContainer");
    const $messageContainer = $("#messagesContainer");
    const $messageTemplate = $("#messageTemplate").clone().removeAttr("id");

    // Initialisation de l'application
    $alert.hide();
    $userInfos.hide();
    $roomContainer.children("ul").empty();
    $("#messageTemplate").hide();
    $messageForm.find("button, textarea").prop("disabled", true);
    $roomForm.find("button, input").prop("disabled", true);

    // Sérialisation sous form d'objet
    // input pour login et pwd apres une serialisation qui est obligatoire pour recuperer les donner du formulaire => $(form).serializeArray()
    // [{name: "login", value: "Driifti"}, {name:"pwd", value:"123"}]
    // Ce que je veux obtenir
    // {login: "Driifti", pwd: "123"}
    function serializeObject(input){
        let data = {};
        for(item of input){
            data[item.name] = item.value
        }
        return data;
    }

    /**
     * Affichage d'un message temporaire à l'écran
     * @param {string} text : Le texte du message
     * @param {string} className : La classe Bootstrap alert-[color] du message
     * Exemples :
     * showMessage("Vous êtes connecté");
     * showMessage("Connexion impossible", "alert-danger");
     */
    function showMessage(text, className="alert-success"){
        $alert.html(text);
        if(className == "alert-danger"){
            $alert.addClass(className);
            $alert.removeClass("alert-success");
        } else {
            $alert.addClass(className);
            $alert.removeClass("alert-danger");
        }

        $alert.show();

        setTimeout(function(){
            $alert.hide();
        }, 3000);
    }

    /**
     * Affiche le nom de l'utilisateur connecté
     * ainsi que le salon actif dans une zone de l'écran ciblé par $userInfos
     */
    function showUserInfos(){
        //console.log(currentUser);
        // Initialisation du message
        let message = "";

        // Infos utilisateur
        if(isUserConnected()){
            message += "Bonjour " + currentUser.name;
        }
        if(isRoomSelected()){
            message += " Vous êtes dans le salon " + activeRoom.title;
        }

        // Affichage de la cible
        $userInfos.show().children("h4").html(message);
    }

    /**
     * Fonction générique pour vidé la sasisie d'un formulaire
     * @param {jQueryObject} target : Le formulaire à vider
     */
    function resetForm(target){
        $(target).find("input, textarea, select").val("");
    }

    // Traitement de l'inscription
    $registerForm.submit(function(event){
        // Empêcher l'envoi du formulaire
        event.preventDefault();

        // Récupération des données
        const data = serializeObject($(this).serializeArray());

        // Validation des données
        if(!data.name || !data.login || !data.password) {
            showMessage("Saisie invalide", "alert-danger");
            // Arrête la function
            return;
        }

        // Envoi des données par la biais d'une requête AJAX sur l'API
        $.post(URL + "user", data)
            // Succès
            .done(function(response){
                // Affichage du message
                showMessage("vous êtes inscrit et connecté");
                // Affectation de l'utilisateur
                currentUser = response[response.length - 1];
                // RAZ du formulaire
                resetForm($(this));
                // Fermeture de la fenêtre modale
                $registerModal.modal("hide");
                // Affichage des infos utilisateur
                showUserInfos();
                // Afficher la liste des salons
                showRoomList();
            })
            // Echec
            .fail(function(err){
                console.log(err);
                // Affichage du message
                showMessage("Inscription impossible", "alert-danger");
            });
    });

    // Traitement du login
    $loginForm.submit(function(event){
        // Empêcher l'envoi du formulaire
        event.preventDefault();

        // Récupération des données
        const data = serializeObject($(this).serializeArray());

        // Validation des données
        if( !data.login || !data.password) {
            showMessage("Saisie invalide", "alert-danger");
            // Arrête la function
            return;
        }

        // Envoi des données par la biais d'une requête AJAX sur l'API
        $.post(URL + "login", data)
            // Succès
            .done(function(response){
                // Affichage du message
                showMessage("Vous êtes connecté");
                // Affectation de l'utilisateur
                currentUser = response;
                // RAZ du formulaire
                resetForm($(this));
                // Fermeture de la fenêtre modale
                $loginModal.modal("hide");
                // Affichage des infos utilisateur
                showUserInfos();
                // Afficher la liste des salons
                showRoomList();
            })
            // Echec
            .fail(function(err){
                console.log(err);
                // Affichage du message
                showMessage("Connexion impossible", "alert-danger");
            });
    });

    // Affichage des salons
    function showRoomList(){
        // activation du formulaire de création des messages
        $roomForm.find("button, input").prop("disabled", false);
        // Requête AJAX pour obtenir la liste des salons
        $.get(URL + "room")
            // Succès
            .done(function(response){
                // Récupération du parent des éléments de liste
                const $parent = $roomContainer.children("ul");
                // Effacer les enfants
                $parent.empty();
                // Boucle sur la response pour créer de nouveau enfants
                for (let room of response){
                    // Création du <li> qui représente un salon
                    let $li = $(`<li class="list-group-item">${room.title}</li>`);
                    // Renregistrement des données du salon dans le <li>
                    $li.data("room", JSON.stringify(room));
                    // Attribuer la classe active au salon en cours
                    if(activeRoom.id === room.id){
                        $li.addClass("active");
                    }
                    // Ajout du <li> au parents <ul>
                    $parent.append($li);
                }
            })
            // Echec
            //.fail(err => console.log(err));
            .fail(function(err){
                console.log(err);
            });
    }

    // clic sur un salon
    $roomContainer.delegate("li", "click", function(){
        // Récupération des données du salon
        let room = $(this).data("room");
        // Déserialisation des données (convertir de chaine de caratère en objet)
        room = JSON.parse(room);
        // Définition du salon actif
        activeRoom = room;
        // Mise à jour des infos utilisateur
        showUserInfos();
        // Désactivation des salons
        $roomContainer.find("li").removeClass("active");
        //Activation du salon
        $(this).addClass("active");
        // activation du formulaire des messages
        $messageForm.find("button, textarea").prop("disabled", false);
        // Affichage de la liste des messages
        showMessageList();
    });

    //Affichage des message du salon actif
    function showMessageList(){
        // Cas d'exception qui ne doit pas arriver
        // Mais Murphy is alive
        if(!isRoomSelected()){
            return;
        }
        // Requête AJAX pour récuperé les messages d'un salon
        $.get(URL + "room/" + activeRoom.id)
        // Succès
        .done(function(response){
            // Effacer les messages existants
            $messageContainer.empty();
            // Trier les messages par ordre décroissant de l'id
            response.messages.sort((a,b) => b.id - a.id);
            // Afficher seulement les 7 dernier messages
            response.messages = response.messages.slice( 0, 7 );
            // Boucle sur la response
            for(let message of response.messages){
                // Clone du template
                const $messageDiv = $messageTemplate.clone();
                // Classe pour les messages de l'utilisateur connecté
                let className = "mr-5 bg-primary";
                if(message.userId != currentUser.id){
                    className = "ml-5 bg-light";
                }
                $messageDiv.addClass(className)
                // Affichage de l'heure dans les messages
                let createdAt = new Date(message.id).toLocaleTimeString()
                // Ecriture des données du message dans la DIV
                $messageDiv.children("h4").html(`A ${createdAt} ${message.user.name} dit:`);
                $messageDiv.children("p").html(message.text);
                // Ajout du message au DOM
                $messageContainer.append($messageDiv);
            }
        })
        // Echec
        .fail(err => console.log(err));
    };

    // Création d'un nouveau message
    $messageForm.submit(function(event){
        // Empêcher l'envoi du formulaire
        event.preventDefault();
        // Récupération des données
        let data = serializeObject($(this).serializeArray());
        // Ajout des données du salon et de l'utilisateur
        data.userId = currentUser.id;
        data.roomId = activeRoom.id;
        // Requête AJAX pour envoi des données pour la création du message
        $.post(URL + "message", data)
        // Succès
        .done(function(response){
            // Affichage du message de succès
            showMessage("votre message est enregistré");
            // Affichage de la liste des messages
            showMessageList();
            // Remise à zero du formulaire d'envoi de message
            resetForm($messageForm);
        })
        // Echec
        .fail(function(err){
            console.log(err);
            // Affichage du messade de l'echec
            showMessage("Impossible de créer le message", "alert-danger");
        });
    });

    // Création d'un salon
    $roomForm.submit(function(event){
        // Empêcher l'envoi du formulaire
        event.preventDefault();
        // Récupération des données
        let data = serializeObject($(this).serializeArray());
        // Ajout des données de l'utilisateur
        data.userId = currentUser.id;
        // Requête AJAX pour l'envoi des données pour la création d'un salon
        $.post(URL + "room", data)
        // Succès
        .done(function(response){
            // Affichage du message de succès
            showMessage("Votre salon est ouvert");
            // Change le salon actif
            activeRoom = response[response.length - 1];
            // Rafraichir la liste des salons
            showRoomList();
            resetForm($roomForm);
        })
        // Echec
        .fail(function(err){
            console.log(err)
            // Affichage du message d'erreur
            showMessage("Impossible d'ouvrir le salon", "alert-danger");
        });
    });

    setInterval(function(){
        if(isRoomSelected() && isUserConnected()){
            showMessageList();
            showRoomList();
        }
    }, 500);
});