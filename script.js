const input = document.querySelector("#input");
const output = document.querySelector("#output");

class Iter {
    constructor(array) {
        this.idx = -1;
        this.array = array;
    }
    next() {
        this.idx += 1;
        return this.array[this.idx];
    }
    peek() {
        return this.array[this.idk + 1];
    }
}

function readString(event) {
    let file = event.target.files[0];
    if (!file)
        return;

    let reader = new FileReader();
    reader.readAsText(file);
    return reader.result;

}

function saveString(s, filename) {
    let href = window.URL.createObjectURL(new Blob([s], {type: 'text/plain'}));

    let element = document.createElement("a");
    element.href = href;
    element.download = filename;
    element.click();
}

function parseText(text) {
    let chunks = text.split("\n\n\n");

    let parsedChunks = [];

    for (const chunk of chunks)
        parsedChunks.push(parseChunk(chunk));

    let parsedText = [];


    for (const parsedChunk of parsedChunks) {
        let ret = {
            name: parsedChunk.name,
            pictures: parsedChunk.pictures,
            textData: []
        }
        let textDataIter = new Iter(parsedChunk.textData);

        let val;

        while (val = textDataIter.next()) {
            let data = {};

            sw: switch (val.type) {
                case "blank":
                    if ((val = textDataIter.peek() || {}).type == "blank") {
                        data.type = "separator";
                        textDataIter.next();
                    } else {
                        data.type = "big_separator";
                    }

                    break sw;

                case "text":
                    let text = val.text;
                    while ((textDataIter.peek() || {}).type == "text") {
                        text += "\n" + textDataIter.peek().text;
                        textDataIter.next();
                    }

                    data.type = "text"
                    data.text = text;

                    break sw;

                case "point":
                    let pointText = val.text;

                    while ((textDataIter.peek() || {}).type == "point") {
                        let text = "\n" + textDataIter.peek().text;
                        textDataIter.next();
                    }

                    data.type = "points";
                    data.value = pointText.split("\n");

                    break sw;

                default:
                    console.error("developer is idiot", val.type);
            }


            ret.textData.push(data);
        }

        parsedText.push(ret);
    }

    return parsedText;
}

function parseChunk(chunk) {
    let lines = chunk.split("\n");
    if (lines.length < 2)
        return 0;

    let name = lines[0];
    let pictures = lines[1].split(" ");
    if (lines[1] == "bez obrázku" || lines[1] == "bez obrázků")
        pictures = [];

    let textData = parseChunkText(lines.slice(2));

    return { name, pictures, textData };
}

function parseChunkText(textLines) {
    let output = [];

    for (let line of textLines) {
        let type = "text"

        let indent_spaces = 0;

        let idx = 0;

        for (idx; line[idx] == " "; idx += 1)
            indent_spaces += 1;

        let is_point = false;

        if (line[idx] == "-") {
            is_point = true;
            type = "point"
            if (line[idx + 1] == " ")
                idx += 1;
            line = line.slice(idx);
        }

        if (!is_point && line.length == 0) {
            type = "blank";
        }


        output.push({ type, text: line });
    }

    return output;
}


function generateHTML(parsedText) {
    let bigContent = document.createElement("div");
    for (const chunk of parsedText) {
        let content = document.createElement("div");

        let title = document.createElement("h2");
        title.innerText = chunk.name;
        content.appendChild(title);

        for (const imgUrl of chunk.pictures) {
            let img = document.createElement("img");
            img.src = imgUrl;
            content.appendChild(img);
            content.appendChild(document.createElement("br"));
        }

        for (const item of chunk.textData) {
            sw: switch (item.type) {
                case "separator":
                    break sw;

                case "big_separator":
                    content.appendChild(document.createElement("br"));

                    break sw;

                case "text":
                    let p = document.createElement("p");
                    p.innerHTML = item.text;
                    content.appendChild(p);

                    break sw;

                case "points":
                    let ol = document.createElement("ol");
                    for (const value of item.value) {
                        let li = document.createElement("li");
                        li.innerHTML = value;
                        ol.appendChild(li);
                    }
                    content.appendChild(ol);

                    break sw;

                default:
                    console.error("developer is idiot", item.type);
            }
        }

        bigContent.appendChild(content)
    }
    return bigContent.innerHTML;
}