$("input").click(function () {
    $(this).removeClass("is-invalid");

});

$("#submit").click(function (e) {
    let form = $("#autodichiarazione_form");
    if (!form[0].checkValidity()) {
        $("input:required").filter(function () {
            return !this.value;
        }).addClass("is-invalid");

        $("input:checkbox:not(:checked)").addClass("is-invalid");

        console.log($("input[name=mds]").val());

        $(".err-msg").show();
        justSubmitted = true;
        return;
    }

    let form_content = form.serializeArray();

    let template_values = {};

    form_content.forEach((x) => template_values[x.name] = x.value);

    let dob = template_values["dob"].split("-");
    template_values["dob_day"] = dob[0];
    template_values["dob_month"] = dob[1];
    template_values["dob_year"] = dob[2];

    let rdid = template_values["rdid"].split("-");
    template_values["rdid_day"] = rdid[0];
    template_values["rdid_month"] = rdid[1];
    template_values["rdid_year"] = rdid[2];

    if (template_values["mds"] == "lav") {
        template_values["mds_text"] = "Comprovate esigenze lavorative."
    } else if (template_values["mds"] == "au") {
        template_values["mds_text"] = "Assoluta urgenza (per trasferimenti in comune diverso)."
    } else if (template_values["mds"] == "nec") {
        template_values["mds_text"] = "Situazione di necessità (per spostamenti all’interno dello stesso comune o che rivestono\n" +
            "       carattere di quotidianità o che, comunque, siano effettuati abitualmente in ragione della\n" +
            "brevità delle distanze da percorrere);"
    } else if (template_values["mds"] == "sal") {
        template_values["mds_text"] = "Motivi di salute.";
    }

    generate(template_values);
});


function loadFile(url, callback) {
    PizZipUtils.getBinaryContent(url, callback);
}

function generate(data) {
    loadFile("template.docx", function (error, content) {
        if (error) {
            throw error
        }
        ;

        function replaceErrors(key, value) {
            if (value instanceof Error) {
                return Object.getOwnPropertyNames(value).reduce(function (error, key) {
                    error[key] = value[key];
                    return error;
                }, {});
            }
            return value;
        }

        function errorHandler(error) {
            console.log(JSON.stringify({error: error}, replaceErrors));

            if (error.properties && error.properties.errors instanceof Array) {
                const errorMessages = error.properties.errors.map(function (error) {
                    return error.properties.explanation;
                }).join("\n");
                console.log('errorMessages', errorMessages);
            }
            throw error;
        }

        var zip = new PizZip(content);
        var doc;
        try {
            doc = new window.docxtemplater(zip);
        } catch (error) {
            errorHandler(error);
        }

        doc.setData(data);
        try {
            doc.render();
        } catch (error) {
            errorHandler(error);
        }

        var out = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }) //Output the document using Data-URI
        saveAs(out, "dichiarazione.docx")
    })
}
