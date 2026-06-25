# Changes — nextjs-shared, "version": "2.1.4"

## src/tables/tableGeneric/write_logging.ts
- Added `console.log` in the catch block to echo the original log entry when the DB write fails (e.g. xlg_logging table missing), so the message is not silently lost
