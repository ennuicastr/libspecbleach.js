#!/usr/bin/env node
/*
 * Copyright (C) 2019-2022 Yahweasel
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
 * SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION
 * OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
 * CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

const fs = require("fs");
const funcs = JSON.parse(fs.readFileSync("funcs.json", "utf8"));

function s(x) {
    return JSON.stringify(x);
}

function accessors(f) {
    funcs.accessors.forEach((type) => {
        type[1].forEach((field) => {
            if (typeof field === "object")
                f(type[0] + "_" + field.name + "_a", field);
            else
                f(type[0] + "_" + field, null);
        });
    });
}

function decls(f, meta) {
    funcs.functions.forEach((decl) => {
        f(decl[0]);
    });
    accessors((decl) => {
        f(decl);
        f(decl+"_s");
    });
}

function shortNm(f) {
    if (f === "specbleach_free")
        return f;
    return f.replace(/^specbleach_/, "");
}

// post.js
(function() {
    var inp = fs.readFileSync("post.in.js", "utf8");

    var outp = "";
    funcs.functions.forEach((decl) => {
        var nm = shortNm(decl[0]);
        outp += `var ${decl[0]} = ` +
            `Module.${nm} = ` +
            `Module.cwrap(${s(decl[0])}, ${s(decl[1])}, ${s(decl[2])}`;
        if (decl[3] && decl[3].async)
            outp += `, {async:true}`;
        outp += ");\n";
    });
    accessors((decl, field) => {
        if (field && field.array) {
            outp += `var ${decl} = ` +
                `Module.${decl} = ` +
                `Module.cwrap(${s(decl)}, "number", ["number", "number"]);\n` +
                `var ${decl}_s = ` +
                `Module.${decl}_s = ` +
                `Module.cwrap(${s(decl+"_s")}, null, ["number", "number", "number"]);\n`;

        } else {
            outp += `var ${decl} = ` +
                `Module.${decl} = ` +
                `Module.cwrap(${s(decl)}, "number", ["number"]);\n` +
                `var ${decl}_s = ` +
                `Module.${decl}_s = ` +
                `Module.cwrap(${s(decl+"_s")}, null, ["number", "number"]);\n`;
        }
    });

    outp = inp.replace("@FUNCS", outp);

    fs.writeFileSync("build/post.js", outp);
})();

// libspecbleach.types.d.ts
(function() {
    var inp = fs.readFileSync("libspecbleach.types.in.d.ts", "utf8");

    function args(x) {
        return x.map((t, idx) => `a${idx}: ${t}`).join(",");
    }

    function ret(x) {
        return (x === null) ? "void" : x;
    }

    var outp = "";
    funcs.functions.forEach((decl) => {
        var nm = shortNm(decl[0]);
        outp += `${nm}(${args(decl[2])}): ${ret(decl[1])};\n`;
    });
    accessors((decl, field) => {
        if (field && field.array) {
            outp += `${decl}(ptr: number, idx: number): number;\n`;
            outp += `${decl}_s(ptr: number, idx: number, val: number): void;\n`;
        } else {
            outp += `${decl}(ptr: number): number;\n`;
            outp += `${decl}_s(ptr: number, val: number): void;\n`;
        }
    });

    inp = inp.replace("@FUNCS", outp);

    /* We also read type declarations out of post.in.js, to keep all the decls
     * in one place */
    outp = "";
    let lastComment = "";
    let inComment = false;
    let lastTypes = "";
    let inTypes = false;
    for (const line of fs.readFileSync("post.in.js", "utf8").split("\n")) {
        if (line === "/**") {
            inComment = true;
            lastComment = line + "\n";
        } else if (inComment) {
            lastComment += line + "\n";
            if (line === " */")
                inComment = false;
        } else if (line === "/* @types") {
            inTypes = true;
            lastTypes = "";
        } else if (inTypes) {
            if (line === " */") {
                inTypes = false;
                outp += lastComment + lastTypes.trim() + ";\n";
            } else {
                lastTypes += line.slice(3) + "\n";
            }
        } else if (line.slice(0, 10) === "/// @types") {
            outp += lastComment + line.slice(11) + ";\n";
        }
    }
    outp = inp.replace("@DECLS", outp);

    fs.writeFileSync("dist/libspecbleach.types.d.ts", outp);
})();

// exports.json
(function() {
    var outp = [];
    decls((decl) => {
        outp.push("_" + decl);
    });

    fs.writeFileSync("build/exports.json", s(outp));
})();
