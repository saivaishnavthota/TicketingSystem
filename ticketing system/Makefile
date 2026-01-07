.PHONY: help build up down logs restart clean backup restore ssl

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

up-prod: ## Start all services with production config
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d

down: ## Stop all services
	docker-compose down

down-volumes: ## Stop all services and remove volumes
	docker-compose down -v

logs: ## View logs from all services
	docker-compose logs -f

logs-api: ## View API logs
	docker-compose logs -f api

logs-db: ## View database logs
	docker-compose logs -f postgres

restart: ## Restart all services
	docker-compose restart

restart-api: ## Restart API service
	docker-compose restart api

clean: ## Remove all containers, images, and volumes
	docker-compose down -v --rmi all

ps: ## Show running containers
	docker-compose ps

backup: ## Backup database
	@bash scripts/backup-db.sh

restore: ## Restore database (usage: make restore FILE=backup.sql.gz)
	@bash scripts/restore-db.sh $(FILE)

ssl: ## Generate self-signed SSL certificate (not needed for HTTP-only setup)
	@echo "Note: This application runs on HTTP only. SSL not required."
	@echo "If you need HTTPS, configure it at your load balancer or reverse proxy level."

shell-api: ## Open shell in API container
	docker exec -it itsm-api sh

shell-db: ## Open PostgreSQL shell
	docker exec -it itsm-postgres psql -U itsm_user -d itsm_platform

health: ## Check health of all services
	@echo "Checking service health..."
	@docker-compose ps
	@echo ""
	@echo "API Health:"
	@curl -s http://localhost:3000/health | jq . || echo "API not responding"

install: ## Initial setup (build, start services)
	@echo "Setting up ITSM Platform..."
	@cp .env.example .env
	@echo "Please edit .env file with your configuration"
	@read -p "Press enter to continue..."
	@make build
	@make up
	@echo ""
	@echo "ITSM Platform is starting up..."
	@echo "API will be available at http://localhost:3000"
	@echo "Run 'make logs' to view logs"
