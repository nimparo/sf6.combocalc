const inputContainer = document.getElementById('input-rows');
const template = document.getElementById('input-template');
const addBtn = document.getElementById('add-row');
const resetBtn = document.getElementById('reset');
const calcBtn = document.getElementById('calculate');
const resultDisplay = document.getElementById('total-damage');

const translations = {
    ja: {
        title: "スト6コンボダメージ計算機",
        ry: "略語",
        tips: "ヒント",
        DMG: "DMG: ダメージ Damage",
        DS: "DS: 補正値 Damage Scaling",
        CS: "CS: コンボ補正 Combo Scaling",
        SS: "SS: 始動補正 Starter Scaling",
        IS: "IS: 即時補正 Immediate Scaling",
        BD: "BD: 基礎攻撃力 Basic Damage（現状ジェイミー（90+酒Lv×5 or SA2（105））とキンバリーのSA3（111）のみ）",
        DR: "DR: ラッシュ Drive Rush（生ラッシュとキャンセルラッシュの両方。本来始動時はこの補正は乗らないが、壁やられ時のみこの補正が乗るの。コードには書いてないため自分で設定すること。）",
        PP: "PP: ジャスパ Perfect Parry",
        WS: "WS: インパクト壁やられ Wall Splat（ガード時。ヒット時は始動補正20が乗る代わりにこの補正は乗らない。）",
        OB: "OB: ワンボタン One Button（ワンボタンSAの後の追撃はこの補正が乗る。なお、ダメージの無いSAは補正が乗らない）",
        PC: "・パニッシュカウンターの場合、投げ、インパクト、SAを除き始動技のダメージが1.2倍になる。",
        ST: "・また、スタンは1発目がダメージ200(ガード)又は800(ヒット)で始動補正20。",
        MHA: "・多段技をコンボに組み込んだ場合、切り捨ての関係でダメージが本来より多少大きく出る場合がある。これの修正は面倒な割に1桁台しかズレないので放置している。",
        MES: "・これは非公式のものである。すなわち万が一CAPCOM様に怒られたら急に非公開になるかもしれない儚き命である。",
        MES2: " ",
        add: "追加",
        reset: "リセット",
        recal: "コンボダメージの更新",
        result: "コンボダメージ"
    },
    en: {
        title: "SF6 Combo Damage Calculator",
        ry: "Abbreviations",
        tips: "Tips",
        DMG: "DMG: ダメージ Damage",
        DS: "DS: 補正値 Damage Scaling",
        CS: "CS: コンボ補正 Combo Scaling",
        SS: "SS: 始動補正 Starter Scaling",
        IS: "IS: 即時補正 Immediate Scaling",
        BD: "BD: 基礎攻撃力 Basic Damage (Jamie: 90+(Drink level)×5 or 105(SA2), Kimberly: 100 or 111, Others: 100)",
        DR: "DR: ラッシュ Drive Rush (This includes both of parry drive rush and cancel drive rush)",
        PP: "PP: ジャスパ Perfect Parry",
        WS: "WS: インパクト壁やられ Wall Splat (This is applied when the drive impact is blocked. When the drive impact hits, it becomes the starter of combo and has 20% starter scaling without scaling of wall splat.)",
        OB: "OB: ワンボタン One Button (Modern only. All one button SA follow ups have this scaling. If the SA has no damage, there is no one button calling.)",
        PC: "・Punish Counters deal 20% more damage.",
        ST: "・When the opportunity stuns, the starter is the impact with 200 (when bloocked) or 800 (when hitting) damage and 20% starter scaling.",
        MHA: "・When a multi-hit attack is incorporated into a combo, the damage may be slightly larger than it should be due to rounding down. Correcting this is tedious and the margin of error is only in the single digits, so it is left alone.",
        MES: "・This is unofficial. In other words, it is a fleeting life that may suddenly become private if CAPCOM should become angry.",
        MES2: "・I'm not good at English. So the translation may be inaccurate.",
        add: "Add",
        reset: "Reset",
        recal: "Recalculate",
        result: "Combo Damage"
    }
};

function setLanguage(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
}

// ユーザーのブラウザ言語設定を取得
let userLanguage = navigator.language || navigator.userLanguage;
if (userLanguage.startsWith('ja')) {
    setLanguage('ja');
    document.getElementById('language-select').value = 'ja';
} else {
    setLanguage('en');
    document.getElementById('language-select').value = 'en';
}

document.getElementById('language-select').addEventListener('change', (e) => {
    setLanguage(e.target.value);
});

function createRow() {
    const row = template.content.firstElementChild.cloneNode(true);


    // 既存の最後の行からBDとPPをコピーする
    const rows = [...inputContainer.children];
    if (rows.length > 0) {
        const lastRow = rows[rows.length - 1];
        const lastBD = lastRow.querySelector('.bd').value;
        const lastDR = lastRow.querySelector('.dr').checked;
        const lastPP = lastRow.querySelector('.pp').checked;
        const lastWS = lastRow.querySelector('.ws').checked;

        row.querySelector('.bd').value = lastBD;
        row.querySelector('.dr').checked = lastDR;
        row.querySelector('.pp').checked = lastPP;
        row.querySelector('.ws').checked = lastWS;
    }

    // dmgを選択した状態でEnterを押した時
    row.querySelector('.dmg').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const rows = [...inputContainer.children];
            const currentRowIndex = rows.indexOf(row);
            const isLast = currentRowIndex === rows.length - 1;

            if (isLast) {
                const newRow = createRow();
                inputContainer.appendChild(newRow);
                updateAll();
                newRow.querySelector('.dmg').focus();
            } else {
                rows[currentRowIndex + 1].querySelector('.dmg').focus();
            }
        }
    });

    row.querySelector('.delete').addEventListener('click', () => {
        const ob = row.querySelector('.ob');
        ob.checked = false;
        updateAll();
        row.remove();
        updateAll();
    });

    [...row.querySelectorAll('input, select')].forEach(el => {
        el.addEventListener('change', (e) => {
            if (el.classList.contains('pp') || el.classList.contains('ws')) {
                const newValue = el.checked;
                const isPP = el.classList.contains('pp');
                [...inputContainer.children].forEach(r => {
                    const checkbox = r.querySelector(isPP ? '.pp' : '.ws');
                    checkbox.checked = newValue;
                });
            }
            if (el.classList.contains('ob') || el.classList.contains('sa')) {
                handleOBSAChange();
            }
            updateAll();
        });
    });

    return row;
}

function handleOBSAChange() {
    const rows = [...inputContainer.children];
    let lock = false;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const ob = row.querySelector('.ob');
        const sa = row.querySelector('.sa');

        // SAの前回値取得
        const prevSA = sa.dataset.prev || 'X';
        const currSA = sa.value;

        // SAがX以外 → X に変わった場合、以降のOBをfalseに
        if (prevSA !== 'X' && currSA === 'X') {
            for (let j = i + 1; j < rows.length; j++) {
                const obj = rows[j].querySelector('.ob');
                obj.checked = false;
                obj.disabled = false;
            }
        }

        if (!lock && ob.checked && currSA !== 'X') {
            lock = true;
            for (let j = i + 1; j < rows.length; j++) {
                const obj = rows[j].querySelector('.ob');
                obj.checked = true;
                obj.disabled = true;
            }
            break; // ロックしたら終了
        }

        if (!ob.checked && currSA !== 'X') {
            for (let j = i + 1; j < rows.length; j++) {
                const obj = rows[j].querySelector('.ob');
                obj.checked = false;
                obj.disabled = false;
            }
            break;
        }
    }

    if (!lock) {
        for (let i = 0; i < rows.length; i++) {
            rows[i].querySelector('.ob').disabled = false;
        }
    }

    // 最後に全SAのdata-prev更新
    rows.forEach(row => {
        const sa = row.querySelector('.sa');
        sa.dataset.prev = sa.value;
    });
}

function resetRows() {
    inputContainer.innerHTML = '';
    const row = createRow();
    inputContainer.appendChild(row);
    updateAll();
    row.querySelector('.dmg').focus();

    // SAのdata-prev初期化
    const rows = [...inputContainer.children];
    rows.forEach(row => {
        const sa = row.querySelector('.sa');
        sa.dataset.prev = sa.value;
    });
}

function updateAll() {
    handleOBSAChange();
    const rows = [...inputContainer.children];
    let AS = 100;

    let allDRs = rows.map(row => row.querySelector('.dr'));
    let previousDRStates = allDRs.map(dr => dr.dataset.prev === 'true');

    for (let i = 0; i < rows.length; i++) {
        const dr = allDRs[i];
        if (dr.checked !== previousDRStates[i]) {
            if (!dr.checked) {
                allDRs.forEach(d => d.checked = false);
            } else {
                for (let j = i; j < rows.length; j++) {
                    allDRs[j].checked = true;
                }
            }
            break;
        }
    }

    allDRs.forEach(dr => dr.dataset.prev = dr.checked);

    let allBDs = rows.map(row => row.querySelector('.bd'));
    let previousBDValues = allBDs.map(bd => bd.dataset.prev);

    for (let i = 0; i < rows.length; i++) {
        const bd = allBDs[i];
        if (bd.value !== previousBDValues[i]) {
            for (let j = i; j < rows.length; j++) {
                allBDs[j].value = bd.value;
            }
            break;
        }
    }

    allBDs.forEach(bd => bd.dataset.prev = bd.value);

    rows.forEach((row, idx) => {
        const dmg = Number(row.querySelector('.dmg').value) || 0;
        const cs = Number(row.querySelector('.cs').value || 10);
        const ss = Number(row.querySelector('.ss').value || 0);
        const isv = Number(row.querySelector('.is').value || 0);
        const bd = Number(row.querySelector('.bd').value || 100);
        const dr = row.querySelector('.dr');
        const pp = row.querySelector('.pp');
        const ws = row.querySelector('.ws');
        const ob = row.querySelector('.ob');
        const sa = row.querySelector('.sa');

        if (idx === 0) {
            AS = 100 - isv;
        } else if (idx === 1) {
            AS = 100 - (rows[0].querySelector('.ss').value || 0) - isv;
        } else {
            const prevRow = rows[idx - 1];
            const prevCS = Number(prevRow.querySelector('.cs').value || 10);
            const prevASVal = prevRow.dataset.as ? Number(prevRow.dataset.as) : 100;
            AS = prevASVal - prevCS - isv;
            if (prevASVal === 100) AS = Math.floor(AS - 10);
        }

        AS = Math.max(10, AS);
        row.dataset.as = AS;

        const drVal = dr.checked ? 85 : 100;
        const ppVal = pp.checked ? 50 : 100;
        const wsVal = ws.checked ? 80 : 100;
        const obVal = ob.checked ? 80 : 100;

        let ds = Math.floor((AS * bd * drVal * ppVal * wsVal * obVal) / 100 ** 5);

        if (sa.value !== 'X') {
            const min = { '1': 30, '2': 40, '3': 50 }[sa.value];
            if (ds < min) ds = min;
        }

        row.querySelector('.ds').textContent = ds;
        row.dataset.ds = ds;
    });

    // DS計算や表示まで完了したら最後に合計も更新
    calculateTotal();
}

function calculateTotal() {
    let total = 0;
    [...inputContainer.children].forEach(row => {
        const dmg = Number(row.querySelector('.dmg').value || 0);
        const ds = Number(row.dataset.ds || 0);
        total += Math.floor(dmg * ds / 100);
    });
    resultDisplay.textContent = total;
}

addBtn.addEventListener('click', () => {
    const row = createRow();
    inputContainer.appendChild(row);
    updateAll();
    row.querySelector('.dmg').focus();
});

resetBtn.addEventListener('click', resetRows);
calcBtn.addEventListener('click', calculateTotal);

resetRows();