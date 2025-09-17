import unittest
import json
from run import app
from io import BytesIO
import openpyxl

class ExcelGeneratorTestCase(unittest.TestCase):

    def setUp(self):
        """Set up a test client for the app."""
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    def test_gerar_lote_excel_with_empresa(self):
        """Test the Excel generation with the 'empresa' field."""
        # Sample data including the new 'empresa' field
        test_data = [
            {
                "barcode": "12345",
                "empresa": "My Company",
                "numero": "987654/32",
                "data": "15/07/2024",
                "instrumento": "Termometro",
                "id_doc": "ID001",
                "tag": "TAG01",
                "equipamento": "Estufa",
                "modelo": "M001",
                "fabricante": "Fab Inc.",
                "sala": "S01",
                "bloco": "B01"
            }
        ]

        # Simulate a POST request to the endpoint
        response = self.client.post('/gerar_lote', data={'batch_data': json.dumps(test_data)})

        # Check that the request was successful
        self.assertEqual(response.status_code, 200)

        # Load the generated Excel file from the response data
        memoria_excel = BytesIO(response.data)
        workbook = openpyxl.load_workbook(memoria_excel)
        sheet = workbook.active

        # The data should be in the second row (A2, B2, etc.)
        # The description is in the 10th column (J)
        description_cell = sheet['J2'].value

        # Expected description string
        expected_description_part = "Certificado de Calibração Externa N°: 987654/32 MY COMPANY"

        # Assert that the description contains the new formatted string
        self.assertIn(expected_description_part, description_cell)

    def test_gerar_lote_excel_without_empresa(self):
        """Test the Excel generation without the 'empresa' field."""
        # Sample data without the 'empresa' field
        test_data = [
            {
                "barcode": "67890",
                "numero": "123456/78",
                "data": "16/07/2024",
                "instrumento": "Manometro",
                "id_doc": "ID002",
                "tag": "TAG02",
                "equipamento": "Reator",
                "modelo": "M002",
                "fabricante": "Fab Co.",
                "sala": "S02",
                "bloco": "B02"
            }
        ]

        # Simulate a POST request
        response = self.client.post('/gerar_lote', data={'batch_data': json.dumps(test_data)})

        # Check status code
        self.assertEqual(response.status_code, 200)

        # Load the workbook
        memoria_excel = BytesIO(response.data)
        workbook = openpyxl.load_workbook(memoria_excel)
        sheet = workbook.active

        # Get description from cell J2
        description_cell = sheet['J2'].value

        # Expected description without the company name
        expected_description_part = "Certificado de Calibração Externa N°: 123456/78 - Equipamento:"

        # Assert that the description is correct
        self.assertIn(expected_description_part, description_cell)

if __name__ == '__main__':
    unittest.main()
