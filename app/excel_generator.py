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
        
        # --- PREPARAÇÃO DOS DADOS (VERSÃO 4.1 - COM LÓGICA DE 'N/A') ---
        numero = dados.get('numero') or 'N/A'
        instrumento = dados.get('instrumento', '').title() or 'N/A'
        equipamento = dados.get('equipamento', '').title() or 'N/A'
        tag = dados.get('tag', '').upper() or 'N/A'
        modelo = dados.get('modelo', '').upper() or 'N/A'
        fabricante = dados.get('fabricante', '').title() or 'N/A'
        sala = dados.get('sala', '').upper() or 'N/A'
        bloco = dados.get('bloco', '').upper() or 'N/A'
        id_doc = dados.get('id_doc', '').upper() or 'N/A'
        
        # --- MONTAGEM DA NOVA DESCRIÇÃO ---
        # A montagem agora usa as variáveis já tratadas com 'N/A'
        partes_descricao = [
            "Certificado de Calibração",
            f"Nº: {numero}",
            f"Instrumento: {instrumento}",
            f"ID: {id_doc}",
            f"TAG: {tag}",
            f"Equipamento: {equipamento}",
            f"Modelo: {modelo}",
            f"Fabricante: {fabricante}",
            f"Sala: {sala} - Bloco: {bloco}", # Junção direta com hífen
            data_formatada_descricao
        ]
        
        descricao_final = " - ".join(partes_descricao)

        # --- MONTAGEM DA LINHA COMPLETA PARA O EXCEL ---
        linha_completa = [
            dados.get('barcode'), VALORES_FIXOS['Box #/File No/Unique ID'], VALORES_FIXOS['DEPT.'],
            data_formatada_excel, data_formatada_excel, VALORES_FIXOS['Record Series Code'],
            VALORES_FIXOS['CATEGORY'], VALORES_FIXOS['SUBCATEGORY'], VALORES_FIXOS['Record Series Title/Type'],
            descricao_final,
            dados.get('tag', '').upper() or 'N/A', # A coluna TAG já estava correta
            VALORES_FIXOS['Retention Period'],
            data_destruicao, VALORES_FIXOS['Legal Hold/Product Name'], VALORES_FIXOS['Data Owner'], VALORES_FIXOS['Notes']
        ]
        sheet.append(linha_completa)

    memoria_excel = BytesIO()
    workbook.save(memoria_excel)
    memoria_excel.seek(0)
    return memoria_excel