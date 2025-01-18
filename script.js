document.getElementById('verificaButton').addEventListener('click', verificaTurno);

async function caricaTurni() {
    try {
        const fileId = '1aY577QY5F0HAv5w2Qo5-lJUrlPD7K2xG'; // Usa l'ID del tuo file
        const response = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`);
        if (!response.ok) {
            throw new Error('Errore nel recupero del file: ' + response.statusText + ' (' + response.status + ')');
        }
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonSheet = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        function excelDateToJSDate(serial) {
            const utc_days = Math.floor(serial - 25569);
            const utc_value = utc_days * 86400;
            const date_info = new Date(utc_value * 1000);
            const fractional_day = serial - Math.floor(serial) + 0.0000001;
            const total_seconds = Math.floor(86400 * fractional_day);
            const seconds = total_seconds % 60;
            const hours = Math.floor(total_seconds / (60 * 60));
            const minutes = Math.floor(total_seconds / 60) % 60;

            return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
        }

        function formatDate(date) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = String(date.getFullYear());
            return `${day}/${month}/${year}`;
        }

        const turni = jsonSheet.slice(1).map(row => ({
            MOTOSCAFO: row[0],
            DATA: formatDate(excelDateToJSDate(row[1])),
            TURNO: row[2]
        }));

        console.log("Turni dopo la trasformazione:", turni);
        return turni;
    } catch (error) {
        console.error('Si è verificato un errore:', error);
        document.getElementById('output').innerHTML = 'Errore: ' + error.message;
        return [];
    }
}

async function verificaTurno() {
    var motoscafo = document.getElementById("motoscafo").value;
    var data = document.getElementById("data").value;
    var outputDiv = document.getElementById("output");

    if (motoscafo && data) {
        const turni = await caricaTurni();
        const dataFormattata = data.split('-').reverse().join('/');

        console.log("Dati inseriti:", { motoscafo, data, dataFormattata });

        turni.forEach(turno => console.log(`Motoscafo: ${turno.MOTOSCAFO}, Data: ${turno.DATA}, Turno: ${turno.TURNO}`));

        const turnoTrovato = turni.find(turno => 
            turno.MOTOSCAFO == motoscafo && turno.DATA === dataFormattata);

        console.log("Confronto Date:", turni.map(turno => ({ turno, confronto: turno.DATA === dataFormattata })));

        console.log("Turno trovato:", turnoTrovato);

        if (turnoTrovato) {
            outputDiv.innerHTML = `Il turno per il motoscafo ${motoscafo} del ${dataFormattata} è ${turnoTrovato.TURNO}`;
        } else {
            outputDiv.innerHTML = "Nessun turno trovato per il giorno selezionato.";
        }
    } else {
        outputDiv.innerHTML = "Per favore, seleziona un numero di motoscafo e una data.";
    }
}
