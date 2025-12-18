--
-- PostgreSQL database dump
--


-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1 (Debian 18.1-1.pgdg12+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ensure_weekly_partition(); Type: FUNCTION; Schema: public; Owner: your_db_user
--

CREATE FUNCTION public.ensure_weekly_partition() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    week_start date;
    week_end   date;
    year_week  text;
    part_name  text;
BEGIN
    week_start := date_trunc('week', NEW.ts)::date;
    week_end   := (week_start + interval '7 days')::date;

    year_week := to_char(week_start, 'IYYY') || 'w' || to_char(week_start, 'IW');
    part_name := 'price_history_' || year_week;

    -- Check if partition exists
    PERFORM 1 FROM pg_class WHERE relname = part_name;
    IF NOT FOUND THEN
        -- create partition
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF price_history
             FOR VALUES FROM (%L) TO (%L);',
            part_name, week_start, week_end
        );

        -- Index: (market_id, ts DESC)
        EXECUTE format(
            'CREATE INDEX %I ON %I (market_id, ts DESC);',
            part_name || '_mid_ts_idx', part_name
        );

        -- Index: (ts DESC)
        EXECUTE format(
            'CREATE INDEX %I ON %I (ts DESC);',
            part_name || '_ts_idx', part_name
        );
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.ensure_weekly_partition() OWNER TO your_db_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: markets; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.markets (
    market_id uuid NOT NULL,
    statement text NOT NULL,
    is_open boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp without time zone
);


ALTER TABLE public.markets OWNER TO your_db_user;

--
-- Name: matches; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.matches (
    id integer NOT NULL,
    tx_id1 uuid NOT NULL,
    tx_id2 uuid NOT NULL,
    is_partial boolean NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.matches OWNER TO your_db_user;

--
-- Name: matches_id_seq; Type: SEQUENCE; Schema: public; Owner: your_db_user
--

CREATE SEQUENCE public.matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.matches_id_seq OWNER TO your_db_user;

--
-- Name: matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: your_db_user
--

ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;


--
-- Name: order_requests; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.order_requests (
    tx_id uuid NOT NULL,
    net text DEFAULT 'testnet'::text NOT NULL,
    market_id uuid NOT NULL,
    account_id text NOT NULL,
    market_limit text NOT NULL,
    price_usd double precision NOT NULL,
    qty double precision NOT NULL,
    sig text NOT NULL,
    public_key_hex text NOT NULL,
    evmaddress text NOT NULL,
    keytype integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    generated_at timestamp without time zone NOT NULL,
    CONSTRAINT order_requests_account_id_check CHECK ((length(account_id) >= 5)),
    CONSTRAINT order_requests_evmaddress_check CHECK ((length(evmaddress) = 40)),
    CONSTRAINT order_requests_keytype_check CHECK ((keytype = ANY (ARRAY[1, 2, 3]))),
    CONSTRAINT order_requests_market_limit_check CHECK ((market_limit = ANY (ARRAY['market'::text, 'limit'::text]))),
    CONSTRAINT order_requests_net_check CHECK ((net = ANY (ARRAY['testnet'::text, 'mainnet'::text, 'previewnet'::text]))),
    CONSTRAINT order_requests_price_usd_check CHECK (((price_usd >= ('-1.0'::numeric)::double precision) AND (price_usd <= (1.0)::double precision))),
    CONSTRAINT order_requests_public_key_hex_check CHECK (((length(public_key_hex) > 10) AND (length(public_key_hex) <= 256))),
    CONSTRAINT order_requests_qty_check CHECK ((qty > (0.0)::double precision)),
    CONSTRAINT order_requests_sig_check CHECK (((length(sig) > 10) AND (length(sig) < 256)))
);


ALTER TABLE public.order_requests OWNER TO your_db_user;

--
-- Name: price_history; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.price_history (
    market_id uuid NOT NULL,
    price numeric(18,10) NOT NULL,
    ts timestamp with time zone NOT NULL
)
PARTITION BY RANGE (ts);


ALTER TABLE public.price_history OWNER TO your_db_user;

--
-- Name: price_history_2025w51; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.price_history_2025w51 (
    market_id uuid CONSTRAINT price_history_market_id_not_null NOT NULL,
    price numeric(18,10) CONSTRAINT price_history_price_not_null NOT NULL,
    ts timestamp with time zone CONSTRAINT price_history_ts_not_null NOT NULL
);


ALTER TABLE public.price_history_2025w51 OWNER TO your_db_user;

--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.schema_migrations (
    version bigint NOT NULL,
    dirty boolean NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO your_db_user;

--
-- Name: settlements; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.settlements (
    id integer NOT NULL,
    tx_id1 uuid NOT NULL,
    tx_id2 uuid NOT NULL,
    tx_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.settlements OWNER TO your_db_user;

--
-- Name: settlements_id_seq; Type: SEQUENCE; Schema: public; Owner: your_db_user
--

CREATE SEQUENCE public.settlements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settlements_id_seq OWNER TO your_db_user;

--
-- Name: settlements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: your_db_user
--

ALTER SEQUENCE public.settlements_id_seq OWNED BY public.settlements.id;


--
-- Name: price_history_2025w51; Type: TABLE ATTACH; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history ATTACH PARTITION public.price_history_2025w51 FOR VALUES FROM ('2025-12-15 00:00:00+00') TO ('2025-12-22 00:00:00+00');


--
-- Name: matches id; Type: DEFAULT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);


--
-- Name: settlements id; Type: DEFAULT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.settlements ALTER COLUMN id SET DEFAULT nextval('public.settlements_id_seq'::regclass);


--
-- Name: markets markets_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_pkey PRIMARY KEY (market_id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: order_requests order_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.order_requests
    ADD CONSTRAINT order_requests_pkey PRIMARY KEY (tx_id);


--
-- Name: price_history price_history_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_pkey PRIMARY KEY (market_id, ts);


--
-- Name: price_history_2025w51 price_history_2025w51_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history_2025w51
    ADD CONSTRAINT price_history_2025w51_pkey PRIMARY KEY (market_id, ts);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: settlements settlements_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_pkey PRIMARY KEY (id);


--
-- Name: price_history_2025w51_mid_ts_mid_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_2025w51_mid_ts_mid_ts_idx ON public.price_history_2025w51 USING btree (market_id, ts DESC);


--
-- Name: price_history_2025w51_ts_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_2025w51_ts_ts_idx ON public.price_history_2025w51 USING btree (ts DESC);


--
-- Name: price_history_2025w51_pkey; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_pkey ATTACH PARTITION public.price_history_2025w51_pkey;


--
-- Name: price_history create_weekly_partition; Type: TRIGGER; Schema: public; Owner: your_db_user
--

CREATE TRIGGER create_weekly_partition BEFORE INSERT ON public.price_history FOR EACH ROW EXECUTE FUNCTION public.ensure_weekly_partition();


--
-- PostgreSQL database dump complete
--


