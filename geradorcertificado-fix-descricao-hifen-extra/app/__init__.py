from flask import Flask

def create_app():
    """Cria e configura uma instância da aplicação Flask."""
    app = Flask(__name__, instance_relative_config=True)

    # Configuração da aplicação (se necessário)
    # app.config.from_mapping(
    #     SECRET_KEY='dev',
    # )

    with app.app_context():
        # Importar e registrar o Blueprint
        from . import routes
        app.register_blueprint(routes.main)

    return app
