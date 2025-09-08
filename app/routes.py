from flask import Blueprint, render_template, request, send_file, current_app
import json
from datetime import datetime
from .excel_generator import create_certificate_workbook, create_data_collection_workbook

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template('index.html')

@main.route('/gerar_lote_excel', methods=['POST'])
def gerar_lote_excel():
    try:
        batch_data_str = request.form.get('batch_data')
        form_type = request.form.get('form_type')

        if not batch_data_str:
            return "Erro: Nenhum dado de lote recebido.", 400
        
        items = json.loads(batch_data_str)
        if not items:
            return "Erro: Nenhum item foi adicionado à lista.", 400

        if form_type == 'certificate':
            for i, cert in enumerate(items):
                obrigatorios = ['barcode', 'data', 'numero', 'instrumento']
                for campo in obrigatorios:
                    if not cert.get(campo):
                        return f"Erro no item {i+1}: O campo '{campo}' é obrigatório.", 400
                try:
                    datetime.strptime(cert['data'], '%d/%m/%Y')
                except ValueError:
                    return f"Erro no item {i+1}: O formato da data '{cert['data']}' é inválido. Use dd/mm/aaaa.", 400

            memoria_excel = create_certificate_workbook(items)
            primeiro_barcode = items[0].get('barcode', 'lote').replace('.', '-')
            nome_arquivo = f"lote_caixa_{primeiro_barcode}.xlsx"

        elif form_type == 'data_collection':
            for i, item in enumerate(items):
                obrigatorios = ['barcode', 'data', 'titulo']
                for campo in obrigatorios:
                    if not item.get(campo):
                        return f"Erro no item {i+1}: O campo '{campo}' é obrigatório.", 400
                try:
                    datetime.strptime(item['data'], '%d/%m/%Y')
                except ValueError:
                    return f"Erro no item {i+1}: O formato da data '{item['data']}' é inválido. Use dd/mm/aaaa.", 400

            memoria_excel = create_data_collection_workbook(items)
            primeiro_barcode = items[0].get('barcode', 'lote').replace('.', '-')
            nome_arquivo = f"formulario_coleta_{primeiro_barcode}.xlsx"

        else:
            return "Erro: Tipo de formulário desconhecido.", 400

        return send_file(
            memoria_excel,
            as_attachment=True,
            download_name=nome_arquivo,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        current_app.logger.error(f"DEBUG: Ocorreu um erro -> {e}")
        return f"Ocorreu um erro inesperado. Verifique os logs do servidor."