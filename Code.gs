/**
 * ===================== BACKEND DO PAINEL LANZI (Google Apps Script) =====================
 * Este script transforma uma Google Planilha num pequeno banco de dados na nuvem para o
 * Painel de Precificação. Ele guarda:
 *   - aba "KV"       -> Configurações, regras fiscais, taxas de marketplace e o GMV mensal
 *   - aba "Products" -> o histórico de produtos precificados
 *
 * SENHA DE ACESSO: toda chamada precisa vir com a senha certa. A senha em si NUNCA fica
 * gravada no código nem na planilha em texto simples visível — ela mora nas "Propriedades
 * do script" (um cofre do próprio Google Apps Script, separado do código-fonte).
 * Ninguém definiu uma senha ainda? A primeira pessoa que informar uma (com pelo menos 4
 * caracteres) define a senha para todo mundo dali em diante. Para trocar a senha depois,
 * veja a função resetarSenha_ no fim deste arquivo.
 *
 * COMO PUBLICAR (passo a passo completo nas instruções que acompanham este arquivo):
 *   1. Abra (ou crie) uma Google Planilha em sheets.google.com
 *   2. Menu Extensões > Apps Script
 *   3. Apague o conteúdo de exemplo e cole todo o conteúdo deste arquivo
 *   4. Clique em Implantar > Nova implantação
 *   5. Tipo: "App da Web"
 *   6. Executar como: "Eu"
 *   7. Quem tem acesso: "Qualquer pessoa"
 *   8. Implantar, autorizar o acesso quando pedido, e copiar a URL gerada (termina em /exec)
 *   9. Cole essa URL e defina uma senha na aba Configurações do painel
 */

var SHEET_KV = 'KV';
var SHEET_PRODUCTS = 'Products';
var PRODUCTS_HEADERS = ['id','nome','sku','fornecedor','linha','createdAt','updatedAt','criadoPor','atualizadoPor','json'];
var KV_HEADERS = ['key','value','updatedAt'];
var PASSWORD_PROPERTY = 'APP_PASSWORD';

function verifyPassword_(pass) {
  var props = PropertiesService.getScriptProperties();
  var stored = props.getProperty(PASSWORD_PROPERTY);
  if (!stored) {
    // Ninguém definiu senha ainda: quem informar a primeira (com 4+ caracteres) a define.
    if (pass && String(pass).length >= 4) {
      props.setProperty(PASSWORD_PROPERTY, String(pass));
      return true;
    }
    return false;
  }
  return String(pass) === stored;
}

/**
 * Para trocar a senha manualmente: no editor do Apps Script, selecione esta função no menu
 * suspenso ao lado de "Executar" e clique em "Executar" uma vez (troque o valor abaixo antes).
 * Depois disso a senha antiga para de funcionar imediatamente.
 */
function resetarSenha_() {
  var novaSenha = 'defina-uma-senha-nova-aqui';
  PropertiesService.getScriptProperties().setProperty(PASSWORD_PROPERTY, novaSenha);
}


function getSheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
  }
  return sh;
}

function kvGet_(key) {
  var sh = getSheet_(SHEET_KV, KV_HEADERS);
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
  }
  return null;
}

function kvSet_(key, valueJsonString) {
  var sh = getSheet_(SHEET_KV, KV_HEADERS);
  var data = sh.getDataRange().getValues();
  var now = new Date().toISOString();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sh.getRange(i + 1, 2, 1, 2).setValues([[valueJsonString, now]]);
      return;
    }
  }
  sh.appendRow([key, valueJsonString, now]);
}

function productsList_() {
  var sh = getSheet_(SHEET_PRODUCTS, PRODUCTS_HEADERS);
  var data = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    try {
      var rec = JSON.parse(row[9]);
      rec.id = row[0];
      out.push(rec);
    } catch (e) {
      // linha corrompida — ignora em vez de derrubar a listagem inteira
    }
  }
  out.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
  return out;
}

function productSave_(rec) {
  if (!rec || !rec.id) throw new Error('produto sem id');
  var sh = getSheet_(SHEET_PRODUCTS, PRODUCTS_HEADERS);
  var data = sh.getDataRange().getValues();
  var json = JSON.stringify(rec);
  var row = [
    rec.id, rec.nome || '', rec.sku || '', rec.fornecedor || '', rec.linha || '',
    rec.createdAt || '', rec.updatedAt || '', rec.criadoPorNome || '', rec.atualizadoPorNome || '', json
  ];
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === rec.id) {
      sh.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return;
    }
  }
  sh.appendRow(row);
}

function productDelete_(id) {
  var sh = getSheet_(SHEET_PRODUCTS, PRODUCTS_HEADERS);
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sh.deleteRow(i + 1);
      return;
    }
  }
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : null;
  var pass = e && e.parameter ? e.parameter.pass : null;
  try {
    if (!verifyPassword_(pass)) {
      return jsonOut_({ ok: false, code: 'auth', error: 'senha inválida ou não informada' });
    }
    if (action === 'getConfig') {
      var cfg = kvGet_('config');
      return jsonOut_({ ok: true, data: cfg ? JSON.parse(cfg) : null });
    }
    if (action === 'getGmv') {
      var gmv = kvGet_('gmv');
      return jsonOut_({ ok: true, data: gmv ? JSON.parse(gmv) : null });
    }
    if (action === 'listProducts') {
      return jsonOut_({ ok: true, data: productsList_() });
    }
    return jsonOut_({ ok: false, error: 'ação GET desconhecida: ' + action });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (!verifyPassword_(body.pass)) {
      return jsonOut_({ ok: false, code: 'auth', error: 'senha inválida ou não informada' });
    }
    var action = body.action;
    if (action === 'setConfig') {
      kvSet_('config', JSON.stringify(body.data));
      return jsonOut_({ ok: true });
    }
    if (action === 'setGmv') {
      kvSet_('gmv', JSON.stringify(body.data));
      return jsonOut_({ ok: true });
    }
    if (action === 'saveProduct') {
      productSave_(body.data);
      return jsonOut_({ ok: true });
    }
    if (action === 'deleteProduct') {
      productDelete_(body.id);
      return jsonOut_({ ok: true });
    }
    return jsonOut_({ ok: false, error: 'ação POST desconhecida: ' + action });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}
