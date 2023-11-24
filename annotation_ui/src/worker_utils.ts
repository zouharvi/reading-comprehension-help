
import { range } from "./utils";

export function instantiate_question(question: object) {
    let output = `<div class="performance_question_text">${question["question"]}</div>`

    // add stub checkboxes if they don't exist
    if (!("checkboxes" in question)) {
        question["checkboxes"] = []
    }
    if (!("checkbox_type" in question)) {
        question["checkbox_type"] = "checkbox"
    }

    // insert input fields
    if (question["type"].startsWith("text")) {
        if (question["checkboxes"].length != 0) {
            output += (`<br>`)
        }
        question["checkboxes"].forEach((checkbox, checkbox_i) => {
            output += (`
                <input type="${question['checkbox_type']}" id="q_${question["id"]}_${checkbox_i}" name="${question["id"]}" value="${checkbox}">
                <label for="q_${question["id"]}_${checkbox_i}">${checkbox}</label>
            `)
        })
        if (question["checkboxes"].length != 0) {
            output += (`<br>`)
        }

        if (question["type"] == "text") {
            output += `<textarea class='performance_question_value' qid="${question["id"]}" placeholder='Please provide a detailed answer'></textarea>`
        } else if (question["type"] == "text_small") {
            output += `<textarea class='performance_question_small_value' qid="${question["id"]}"></textarea>`
        }
    } else if (question["type"] == "choices") {
        let options = question["choices"].map((choice) => `<option value="${choice}">${choice}</option>`)
        output += `<select qid="${question["id"]}">\n<option value="blank"></option>\n${options.join("\n")}\n</select>`
    } else if (question["type"] == "likert") {
        let joined_labels = range(1, 5).map((x) => `<label for="likert_${question["id"]}_${x}" value="${x}">${x}</label>`).join("\n")
        let joined_inputs = range(1, 5).map((x) => `<input type="radio" name="likert_${question["id"]}" id="likert_${question["id"]}_${x}" value="${x}" />`).join("\n")

        output += (`
            <div class='performance_question_likert_parent'>
                <div class="performance_question_likert_labels">${joined_labels}</div>
        
                <span class="performance_question_likert_label" style="text-align: right">${question["labels"][0]}</span>
                ${joined_inputs}
                <span class="performance_question_likert_label" style="text-align: left">${question["labels"][1]}</span>
            </div>
        `)
    }
    return output
}

export function setup_input_listeners() {
    $("textarea").each((element_i, element) => {
        let object = $(element);
        object.on("input", () => {
            globalThis.responses[object.attr("qid")] = object.val()
        })
    });

    $("input[type='radio']").each((element_i, element) => {
        let object = $(element);
        object.on("input", () => {
            globalThis.responses[object.attr("name") + "#radio"] = object.val()
        })
    });


    $("input[type='checkbox']").each((element_i, element) => {
        let object = $(element);
        object.on("input", () => {
            if (!globalThis.responses.hasOwnProperty(object.attr("name") + "#checkbox")) {
                globalThis.responses[object.attr("name") + "#checkbox"] = new Set<string>();
            } else {
                globalThis.responses[object.attr("name") + "#checkbox"] = new Set<string>(globalThis.responses[object.attr("name") + "#checkbox"]);
            }

            if (object.is(":checked")) {
                globalThis.responses[object.attr("name") + "#checkbox"].add(object.val())
            } else {
                globalThis.responses[object.attr("name") + "#checkbox"].delete(object.val())
            }
            // turn to array so that it can be serialized
            globalThis.responses[object.attr("name") + "#checkbox"] = Array.from(globalThis.responses[object.attr("name") + "#checkbox"])
        })
    });


    $("select").each((element_i, element) => {
        let object = $(element);
        object.on("input", () => {
            globalThis.responses[object.attr("qid")] = object.val()
        })
    });
}

export function check_button_lock() {
    let answers = new Set(Object.entries(globalThis.responses).map((x: [string, unknown]) => x[0].split("#")[0]))
    $("#button_next").prop("disabled", answers.size < globalThis.expected_responses);
}