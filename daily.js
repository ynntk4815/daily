const dbPromise = idb.open('db', 1, upgradeDB => {
    switch (upgradeDB.oldVersion) {
        case 0:
        case 1:
            var objectStore = upgradeDB.createObjectStore("record", {keyPath: 'id', autoIncrement: true});
            objectStore.createIndex("original", "original", {unique: false});
            objectStore.createIndex("translate", "translate", {unique: false});
            objectStore.createIndex("voiceName", "voiceName", {unique: false});
            objectStore.createIndex("lastDate", "lastDate", {unique: false});
    }
});

var voices = [];
var mVoiceRateValue = 1;

function p() {
    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    $('#add').click(() => {
        var voiceSelect = $('#input_body #voice').val();
        var original = $('#input_body #original').val();
        var translate = $('#input_body #translate').val();
        add(original, translate, voiceSelect).then(updateList);
    });
    updateList();
    var voiceRate = $('#voiceRate');
    voiceRate.change(() => {
        mVoiceRateValue = voiceRate.val() / 10.0;
        $('#voiceRateValue').text(mVoiceRateValue);
    });
}

function updateList() {
    $('.list').empty();
    dbPromise.then(db => {
        return db.transaction("record")
            .objectStore("record").getAll();
    }).then(allObjs => {
        allObjs.forEach(v => {
            $('.list').append(makeView(v));
        });
    });
}

function makeView(data) {
    var view = $('<div>').attr("class", "a");
    var original = $('<span>').attr("class", "title hover").html(data.original);
    original.click(() => {
        var msg = new SpeechSynthesisUtterance(data.original);
        msg.voice = voices.find(v => v.name === data.voiceName);
        msg.rate = mVoiceRateValue;
        window.speechSynthesis.speak(msg);
    });
    var translate = $('<span>').attr("class", "title").html(data.translate);
    view.append(original);
    view.append(translate);
    return view;
//    var video = $('<div>').attr("class", "video");
//    var profile = $('<img>').attr("src", v.user.profile_image_url).attr("class", "profile");
//    var title = $('<span>').attr("class", "title").html(v.title);
//    var display_name = $('<span>').attr("class", "display_name").html(v.user.display_name);
//    var duration = $('<span>').attr("class", "duration").html(v.duration);
//    video.append(duration);
//    video.append(getThumbLink(v, 0));
//    video.append(getThumbLink(v, 1));
//    video.append(getThumbLink(v, 2));
//    video.append(getThumbLink(v, 3));
//    video.append($('<div>').attr("class", "clear"));
//    video.append(profile);
//    video.append(title);
//    video.append("<br>");
//    video.append(display_name);
//    video.append(v.created_at);
//    video.append($('<div>').attr("class", "clear"));

    //video.append(JSON.stringify(v));
}

function add(original, translate, voiceName) {
    return dbPromise.then(db => {
        const tx = db.transaction("record", 'readwrite');
        tx.objectStore("record").put({
            original: original,
            translate: translate,
            voiceName: voiceName,
            lastDate: null
        });
        return tx.complete;
    });
}

function populateVoiceList() {
    console.log("voice list");
    var voiceSelect = $('#input_body #voice');
    voices = speechSynthesis.getVoices();
    voices.forEach(v => {
        voiceSelect.append(
                $("<option></option>").attr("value", v.name).text(v.name));
    });
    //speechSynthesis.onvoiceschanged = () => {};
}
