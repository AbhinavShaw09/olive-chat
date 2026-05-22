.PHONY: dev build lint typecheck db-generate db-migrate db-reset db-studio

dev:
	pnpm dev

start:
	pnpm start

build:
	pnpm build

lint:
	pnpm lint

typecheck:
	pnpm tsc --noEmit

db-generate:
	pnpm prisma generate

db-migrate:
	pnpm prisma migrate dev

db-reset:
	pnpm prisma migrate reset --force

db-studio:
	pnpm prisma studio
