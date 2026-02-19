-- Tabla opcional para almacenar historial de pagos de MercadoPago
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    mercadopago_payment_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL, -- approved, pending, rejected, etc.
    status_detail VARCHAR(255),
    payment_type VARCHAR(50), -- credit_card, debit_card, ticket, account_money, etc.
    payment_method VARCHAR(50), -- visa, master, rapipago, etc.
    transaction_amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'ARS',
    payer_email VARCHAR(255),
    raw_data JSONB, -- Datos completos del pago para debugging
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_mercadopago_payment_id ON payments(mercadopago_payment_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at_trigger
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_payments_updated_at();

-- Comentarios
COMMENT ON TABLE payments IS 'Historial de pagos procesados por MercadoPago';
COMMENT ON COLUMN payments.mercadopago_payment_id IS 'ID del pago en MercadoPago';
COMMENT ON COLUMN payments.raw_data IS 'Información completa del webhook para debugging';
