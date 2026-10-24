'use strict';
// engine.js
function parseNumber(raw, money = false) {
  let s = String(raw ?? '').trim().toLowerCase().replace(/rp\.?/g, '').replace(/\s/g, '');
  s = s.replace(/½/g, '1/2').replace(/¼/g, '1/4').replace(/¾/g, '3/4').replace(/−/g, '-');
  if (!s) return null;
  if (money) s = s.replace(/\./g, '');
  s = s.replace(/,/g, '.');
  if (/^[+-]?\d+(?:\.\d+)?\/[+-]?\d+(?:\.\d+)?$/.test(s)) {
    const [a, b] = s.split('/').map(Number);
    return b === 0 ? null : a / b;
  }
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function initialAnswer(round) {
  if (round.type === 'tiles' || round.type === 'build' || round.type === 'dice') return { selected: [] };
  if (round.type === 'order') return { order: [] };
  if (round.type === 'share') return { baskets: Array(round.baskets).fill(0) };
  if (round.type === 'planner') return { counts: [0, 0] };
  if (round.type === 'repair') return { marked: false, choice: null };
  if (round.type === 'choice' || round.type === 'coordinate') return { choice: null };
  return { values: Array(round.fields?.length || 1).fill(''), drawn: false };
}

function checkAnswer(round, answer) {
  const a = answer || initialAnswer(round);
  const result = (correct, message = '', empty = false) => ({ correct, message, empty });
  if (round.type === 'tiles') {
    if (!a.selected.length) return result(false, 'Pilih ubinnya dulu. Ketuk sekali lagi untuk membatalkan pilihan.', true);
    return result(a.selected.length === round.target, `Kamu memilih ${a.selected.length} dari ${round.count} ubin. Coba bagi semua ubin menjadi kelompok yang sama besar.`);
  }
  if (round.type === 'build') {
    if (!a.selected.length) return result(false, 'Ketuk potongan yang mau kamu pakai untuk membangun rumah.', true);
    const counts = round.shapes.reduce((acc, s, i) => { if (a.selected.includes(i)) acc[s] = (acc[s] || 0) + 1; return acc; }, {});
    return result(Object.entries(round.target).every(([k, v]) => (counts[k] || 0) === v) && a.selected.length === Object.values(round.target).reduce((x,y)=>x+y,0), 'Periksa jumlah segitiga dan persegi yang diminta. Keping yang dipilih tetap tersimpan.');
  }
  if (round.type === 'choice' || round.type === 'coordinate' || round.type === 'repair') {
    if (round.type === 'repair' && !a.marked) return result(false, 'Ketuk bagian yang bergaris putus-putus untuk mulai memperbaiki.', true);
    if (a.choice === null || a.choice === undefined) return result(false, 'Pilih satu jawaban untuk diperiksa.', true);
    return result(a.choice === round.answer, round.wrong || 'Pilihan ini belum sesuai. Amati gambar atau pakai petunjuk, lalu coba lagi.');
  }
  if (round.type === 'order') {
    if (a.order.length !== round.items.length) return result(false, 'Isi semua tempat dengan kartu. Ketuk kartu yang sudah terpasang untuk mengembalikannya.', true);
    return result(a.order.every((id, i) => id === round.answer[i]), 'Urutannya belum pas. Bandingkan ukuran pecahannya dari keseluruhan yang sama besar.');
  }
  if (round.type === 'share') {
    if (a.baskets.reduce((x,y)=>x+y,0) < round.total) return result(false, 'Masih ada buah yang belum dibagi. Semua buah harus masuk keranjang.', true);
    return result(a.baskets.every(n => n === round.total / round.baskets), 'Isi keranjangnya belum sama banyak. Ambil satu buah, lalu pindahkan ke keranjang lain.');
  }
  if (round.type === 'planner') {
    const [x,y] = a.counts;
    const cost = x*round.prices[0]+y*round.prices[1];
    if (x===0 && y===0) return result(false, 'Tambahkan stan dengan tombol tambah dulu.', true);
    return result(x>=round.min && y>=round.min && cost<=round.budget, cost>round.budget ? `Biaya ${cost} token melebihi anggaran ${round.budget} token. Kurangi atau ubah kombinasi stan.` : `Setiap jenis harus punya paling sedikit ${round.min} stan. Periksa kedua jumlahnya.`);
  }
  if (round.type === 'dice') {
    if (!a.selected.length) return result(false, 'Pilih pasangan dadu pada tabel yang jumlahnya sesuai target.', true);
    const expected=[];
    for (let i=1;i<=6;i++) for(let j=1;j<=6;j++) if(i+j===round.sum) expected.push(`${i}-${j}`);
    return result(a.selected.length===expected.length && expected.every(x=>a.selected.includes(x)), `Ada ${a.selected.length} pasangan yang kamu pilih. Periksa jumlah kedua dadu pada setiap sel, lalu cari semua pasangan yang memenuhi.`);
  }
  if (round.type === 'conditional' && !a.drawn) return result(false, 'Ambil bola pertama dulu untuk melihat isi kantong yang sisa.', true);
  const fields = round.fields || [{ answer: round.answer }];
  if (fields.some((f,i) => !String(a.values[i] ?? '').trim())) return result(false, 'Isi semua kotak jawaban dulu.', true);
  const values = fields.map((f,i)=>parseNumber(a.values[i], f.money || round.money));
  if (values.some(x=>x===null)) return result(false, 'Tulis angka, desimal (contoh 0,5), atau pecahan (contoh 1/2).', true);
  return result(values.every((v,i)=>Math.abs(v-fields[i].answer)<1e-8), round.wrong || 'Belum pas. Cek lagi langkahmu dan satuannya ya. Boleh coba lagi!');
}

const completionKey = (track, game) => `${track}:${game}`;
function recordCompletion(state, track, game, details, now = new Date().toISOString()) {
  const key = completionKey(track,game);
  const old = state.completed[key];
  return {
    ...state,
    completed: { ...state.completed, [key]: {
      track, game, firstCompleted: old?.firstCompleted || now, lastCompleted: now,
      attempts: details.attempts, hints: details.hints,
      playCount: (old?.playCount || 0)+1,
      independent: (old?.independent || details.hints === 0)
    } },
    xp: (Object.keys(state.completed).length + (old ? 0 : 1)) * 60,
  };
}
