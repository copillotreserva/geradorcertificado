import openpyxl
from datetime import datetime
from io import BytesIO

CABECALHO = [
    'Barcode #', 'Box #/File No/Unique ID', 'DEPT.', 'Date From', 'Date To',
    'Record Series Code', 'CATEGORY', 'SUBCATEGORY', 'Record Series Title/Type',
    'Record Description or Box Description', 'TAG', 'Retention Period',
    'Destruction Date', 'Legal Hold/Product Name', 'Data Owner', 'Notes'
]
VALORES_FIXOS = {
    'Box #/File No/Unique ID': 'NA', 'DEPT.': 'Engenharia',
    'Record Series Code': 'MAN-007-002', 'CATEGORY': 'Manufacturing', 'SUBCATEGORY': 'Plant Model',
    'Record Series Title/Type': 'Validation lifecycle documentation', 'Retention Period': 'Retired + 11 years',
    'Legal Hold/Product Name': 'N/A', 'Data Owner': 'N/A',
    'Notes': ''
}

def create_certificate_workbook(lista_certificados):
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.append(CABECALHO)

    for dados in lista_certificados:
        data_calibracao_obj = datetime.strptime(dados['data'], '%d/%m/%Y')
        data_formatada_excel = data_calibracao_obj.strftime('%d/%m/%Y')
        data_formatada_descricao = data_calibracao_obj.strftime('%d/%b/%Y')
        data_destruicao = "31/12/2036"
        
        # --- PREPARAÇÃO DOS DADOS COM AS NOVAS REGRAS DE FORMATAÇÃO ---
        numero = dados.get('numero', 'N/A')
        equipamento = dados.get('equipamento', '').title()
        tag = dados.get('tag', '').upper()
        modelo = dados.get('modelo', '').upper()
        fabricante = dados.get('fabricante', '').title()
        sala = dados.get('sala', '').upper()
        bloco = dados.get('bloco', '').upper()
        id_doc = dados.get('id_doc', '').upper()
        
        # --- MONTAGEM DA NOVA DESCRIÇÃO (COM ORDEM E HÍFEN AJUSTADOS) ---
        partes_descricao = ["Certificado de Calibração"]
        
        partes_descricao.append(f"Nº: {numero}")
        partes_descricao.append(f"Equipamento: {equipamento}")
        
        # ID agora vem depois de Equipamento
        if id_doc: partes_descricao.append(f"ID: {id_doc}")

        # Restante dos campos
        if tag: partes_descricao.append(f"TAG: {tag}")
        if modelo: partes_descricao.append(f"Modelo: {modelo}")
        if fabricante: partes_descricao.append(f"Fabricante: {fabricante}")
        
        # Lógica de Sala e Bloco com hífen
        localizacao_parts = []
        if sala: localizacao_parts.append(f"Sala: {sala}")
        if bloco: localizacao_parts.append(f"Bloco: {bloco}")
        if localizacao_parts:
             partes_descricao.append(" - ".join(localizacao_parts)) # Junção com hífen
        
        partes_descricao.append(data_formatada_descricao)
        
        descricao_final = " - ".join(partes_descricao)

        # --- MONTAGEM DA LINHA COMPLETA PARA O EXCEL ---
        linha_completa = [
            dados.get('barcode'), VALORES_FIXOS['Box #/File No/Unique ID'], VALORES_FIXOS['DEPT.'],
            data_formatada_excel, data_formatada_excel, VALORES_FIXOS['Record Series Code'],
            VALORES_FIXOS['CATEGORY'], VALORES_FIXOS['SUBCATEGORY'], VALORES_FIXOS['Record Series Title/Type'],
            descricao_final, tag or 'N/A', VALORES_FIXOS['Retention Period'],
            data_destruicao, VALORES_FIXOS['Legal Hold/Product Name'], VALORES_FIXOS['Data Owner'], VALORES_FIXOS['Notes']
        ]
        sheet.append(linha_completa)

    memoria_excel = BytesIO()
    workbook.save(memoria_excel)
    memoria_excel.seek(0)
    return memoria_excel