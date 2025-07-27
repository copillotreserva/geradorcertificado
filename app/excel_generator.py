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
        
        # --- PREPARAÇÃO DOS DADOS COM A LÓGICA "N/A" PARA TODOS OS OPCIONAIS ---
        
        # Campos obrigatórios
        numero = dados.get('numero') or 'N/A'
        instrumento = (dados.get('instrumento') or 'N/A').title()
        
        # Campos opcionais (se vazios, recebem 'N/A' e são formatados)
        equipamento = (dados.get('equipamento') or 'N/A').title()
        tag = (dados.get('tag') or 'N/A').upper()
        bloco = (dados.get('bloco') or 'N/A').upper()
        sala = (dados.get('sala') or 'N/A').upper()
        id_doc = (dados.get('id_doc') or 'N/A').upper()
        fabricante = (dados.get('fabricante') or 'N/A').title()
        modelo = (dados.get('modelo') or 'N/A').upper()

        # --- MONTAGEM DA DESCRIÇÃO NA ORDEM EXATA SOLICITADA ---
        partes_descricao = [
            f"Certificado de Calibração N°: {numero}",
            f"Equipamento: {equipamento}",
            f"TAG: {tag}",
            f"Bloco: {bloco}",
            f"Sala: {sala}",
            f"Instrumento: {instrumento}",
            f"ID: {id_doc}",
            f"Fabricante: {fabricante}",
            f"Modelo: {modelo}",
            data_formatada_descricao
        ]
        
        descricao_final = " - ".join(partes_descricao)

        # --- MONTAGEM DA LINHA COMPLETA PARA O EXCEL ---
        linha_completa = [
            dados.get('barcode'), VALORES_FIXOS['Box #/File No/Unique ID'], VALORES_FIXOS['DEPT.'],
            data_formatada_excel, data_formatada_excel, VALORES_FIXOS['Record Series Code'],
            VALORES_FIXOS['CATEGORY'], VALORES_FIXOS['SUBCATEGORY'], VALORES_FIXOS['Record Series Title/Type'],
            descricao_final, 
            dados.get('tag').upper() if dados.get('tag') else 'N/A', # Lógica para a coluna TAG
            VALORES_FIXOS['Retention Period'],
            data_destruicao, VALORES_FIXOS['Legal Hold/Product Name'], VALORES_FIXOS['Data Owner'], VALORES_FIXOS['Notes']
        ]
        sheet.append(linha_completa)

    memoria_excel = BytesIO()
    workbook.save(memoria_excel)
    memoria_excel.seek(0)
    return memoria_excel