--
-- PostgreSQL database dump
--


-- Dumped from database version 18.1 (Debian 18.1-1.pgdg13+2)
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
-- Name: partman; Type: SCHEMA; Schema: -; Owner: your_db_user
--

CREATE SCHEMA partman;


ALTER SCHEMA partman OWNER TO your_db_user;

--
-- Name: pg_partman; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_partman WITH SCHEMA partman;


--
-- Name: EXTENSION pg_partman; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_partman IS 'Extension to manage partitioned tables by time or ID';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: template_public_price_history; Type: TABLE; Schema: partman; Owner: your_db_user
--

CREATE TABLE partman.template_public_price_history (
    market_id uuid CONSTRAINT price_history_market_id_not_null NOT NULL,
    tx_id uuid CONSTRAINT price_history_tx_id_not_null NOT NULL,
    price numeric(18,10) CONSTRAINT price_history_price_not_null NOT NULL,
    ts timestamp with time zone CONSTRAINT price_history_ts_not_null NOT NULL
);


ALTER TABLE partman.template_public_price_history OWNER TO your_db_user;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.comments (
    comment_id integer NOT NULL,
    market_id uuid NOT NULL,
    account_id character varying(255) NOT NULL,
    sig character varying(2048) NOT NULL,
    public_key character varying(2048) NOT NULL,
    key_type integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.comments OWNER TO your_db_user;

--
-- Name: comments_comment_id_seq; Type: SEQUENCE; Schema: public; Owner: your_db_user
--

CREATE SEQUENCE public.comments_comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_comment_id_seq OWNER TO your_db_user;

--
-- Name: comments_comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: your_db_user
--

ALTER SEQUENCE public.comments_comment_id_seq OWNED BY public.comments.comment_id;


--
-- Name: markets; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.markets (
    market_id uuid NOT NULL,
    net character varying(32) NOT NULL,
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
-- Name: newsletter; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.newsletter (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.newsletter OWNER TO your_db_user;

--
-- Name: newsletter_id_seq; Type: SEQUENCE; Schema: public; Owner: your_db_user
--

CREATE SEQUENCE public.newsletter_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.newsletter_id_seq OWNER TO your_db_user;

--
-- Name: newsletter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: your_db_user
--

ALTER SEQUENCE public.newsletter_id_seq OWNED BY public.newsletter.id;


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
    tx_id uuid NOT NULL,
    price numeric(18,10) NOT NULL,
    ts timestamp with time zone NOT NULL
)
PARTITION BY RANGE (ts);


ALTER TABLE public.price_history OWNER TO your_db_user;

--
-- Name: price_history_default; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.price_history_default (
    market_id uuid CONSTRAINT price_history_market_id_not_null NOT NULL,
    tx_id uuid CONSTRAINT price_history_tx_id_not_null NOT NULL,
    price numeric(18,10) CONSTRAINT price_history_price_not_null NOT NULL,
    ts timestamp with time zone CONSTRAINT price_history_ts_not_null NOT NULL
);


ALTER TABLE public.price_history_default OWNER TO your_db_user;

--
-- Name: price_history_p20251119; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.price_history_p20251119 (
    market_id uuid CONSTRAINT price_history_market_id_not_null NOT NULL,
    tx_id uuid CONSTRAINT price_history_tx_id_not_null NOT NULL,
    price numeric(18,10) CONSTRAINT price_history_price_not_null NOT NULL,
    ts timestamp with time zone CONSTRAINT price_history_ts_not_null NOT NULL
);


ALTER TABLE public.price_history_p20251119 OWNER TO your_db_user;

--
-- Name: price_history_p20251126; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.price_history_p20251126 (
    market_id uuid CONSTRAINT price_history_market_id_not_null NOT NULL,
    tx_id uuid CONSTRAINT price_history_tx_id_not_null NOT NULL,
    price numeric(18,10) CONSTRAINT price_history_price_not_null NOT NULL,
    ts timestamp with time zone CONSTRAINT price_history_ts_not_null NOT NULL
);


ALTER TABLE public.price_history_p20251126 OWNER TO your_db_user;

--
-- Name: price_history_p20251203; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.price_history_p20251203 (
    market_id uuid CONSTRAINT price_history_market_id_not_null NOT NULL,
    tx_id uuid CONSTRAINT price_history_tx_id_not_null NOT NULL,
    price numeric(18,10) CONSTRAINT price_history_price_not_null NOT NULL,
    ts timestamp with time zone CONSTRAINT price_history_ts_not_null NOT NULL
);


ALTER TABLE public.price_history_p20251203 OWNER TO your_db_user;

--
-- Name: price_history_p20251210; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.price_history_p20251210 (
    market_id uuid CONSTRAINT price_history_market_id_not_null NOT NULL,
    tx_id uuid CONSTRAINT price_history_tx_id_not_null NOT NULL,
    price numeric(18,10) CONSTRAINT price_history_price_not_null NOT NULL,
    ts timestamp with time zone CONSTRAINT price_history_ts_not_null NOT NULL
);


ALTER TABLE public.price_history_p20251210 OWNER TO your_db_user;

--
-- Name: price_history_p20251217; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.price_history_p20251217 (
    market_id uuid CONSTRAINT price_history_market_id_not_null NOT NULL,
    tx_id uuid CONSTRAINT price_history_tx_id_not_null NOT NULL,
    price numeric(18,10) CONSTRAINT price_history_price_not_null NOT NULL,
    ts timestamp with time zone CONSTRAINT price_history_ts_not_null NOT NULL
);


ALTER TABLE public.price_history_p20251217 OWNER TO your_db_user;

--
-- Name: price_history_p20251224; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.price_history_p20251224 (
    market_id uuid CONSTRAINT price_history_market_id_not_null NOT NULL,
    tx_id uuid CONSTRAINT price_history_tx_id_not_null NOT NULL,
    price numeric(18,10) CONSTRAINT price_history_price_not_null NOT NULL,
    ts timestamp with time zone CONSTRAINT price_history_ts_not_null NOT NULL
);


ALTER TABLE public.price_history_p20251224 OWNER TO your_db_user;

--
-- Name: price_history_p20251231; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.price_history_p20251231 (
    market_id uuid CONSTRAINT price_history_market_id_not_null NOT NULL,
    tx_id uuid CONSTRAINT price_history_tx_id_not_null NOT NULL,
    price numeric(18,10) CONSTRAINT price_history_price_not_null NOT NULL,
    ts timestamp with time zone CONSTRAINT price_history_ts_not_null NOT NULL
);


ALTER TABLE public.price_history_p20251231 OWNER TO your_db_user;

--
-- Name: price_history_p20260107; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.price_history_p20260107 (
    market_id uuid CONSTRAINT price_history_market_id_not_null NOT NULL,
    tx_id uuid CONSTRAINT price_history_tx_id_not_null NOT NULL,
    price numeric(18,10) CONSTRAINT price_history_price_not_null NOT NULL,
    ts timestamp with time zone CONSTRAINT price_history_ts_not_null NOT NULL
);


ALTER TABLE public.price_history_p20260107 OWNER TO your_db_user;

--
-- Name: price_history_p20260114; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.price_history_p20260114 (
    market_id uuid CONSTRAINT price_history_market_id_not_null NOT NULL,
    tx_id uuid CONSTRAINT price_history_tx_id_not_null NOT NULL,
    price numeric(18,10) CONSTRAINT price_history_price_not_null NOT NULL,
    ts timestamp with time zone CONSTRAINT price_history_ts_not_null NOT NULL
);


ALTER TABLE public.price_history_p20260114 OWNER TO your_db_user;

--
-- Name: price_history_p20260121; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.price_history_p20260121 (
    market_id uuid CONSTRAINT price_history_market_id_not_null NOT NULL,
    tx_id uuid CONSTRAINT price_history_tx_id_not_null NOT NULL,
    price numeric(18,10) CONSTRAINT price_history_price_not_null NOT NULL,
    ts timestamp with time zone CONSTRAINT price_history_ts_not_null NOT NULL
);


ALTER TABLE public.price_history_p20260121 OWNER TO your_db_user;

--
-- Name: price_history_p20260128; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.price_history_p20260128 (
    market_id uuid CONSTRAINT price_history_market_id_not_null NOT NULL,
    tx_id uuid CONSTRAINT price_history_tx_id_not_null NOT NULL,
    price numeric(18,10) CONSTRAINT price_history_price_not_null NOT NULL,
    ts timestamp with time zone CONSTRAINT price_history_ts_not_null NOT NULL
);


ALTER TABLE public.price_history_p20260128 OWNER TO your_db_user;

--
-- Name: price_history_p20260204; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.price_history_p20260204 (
    market_id uuid CONSTRAINT price_history_market_id_not_null NOT NULL,
    tx_id uuid CONSTRAINT price_history_tx_id_not_null NOT NULL,
    price numeric(18,10) CONSTRAINT price_history_price_not_null NOT NULL,
    ts timestamp with time zone CONSTRAINT price_history_ts_not_null NOT NULL
);


ALTER TABLE public.price_history_p20260204 OWNER TO your_db_user;

--
-- Name: price_history_p20260211; Type: TABLE; Schema: public; Owner: your_db_user
--

CREATE TABLE public.price_history_p20260211 (
    market_id uuid CONSTRAINT price_history_market_id_not_null NOT NULL,
    tx_id uuid CONSTRAINT price_history_tx_id_not_null NOT NULL,
    price numeric(18,10) CONSTRAINT price_history_price_not_null NOT NULL,
    ts timestamp with time zone CONSTRAINT price_history_ts_not_null NOT NULL
);


ALTER TABLE public.price_history_p20260211 OWNER TO your_db_user;

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
-- Name: price_history_default; Type: TABLE ATTACH; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history ATTACH PARTITION public.price_history_default DEFAULT;


--
-- Name: price_history_p20251119; Type: TABLE ATTACH; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history ATTACH PARTITION public.price_history_p20251119 FOR VALUES FROM ('2025-11-19 00:00:00+00') TO ('2025-11-26 00:00:00+00');


--
-- Name: price_history_p20251126; Type: TABLE ATTACH; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history ATTACH PARTITION public.price_history_p20251126 FOR VALUES FROM ('2025-11-26 00:00:00+00') TO ('2025-12-03 00:00:00+00');


--
-- Name: price_history_p20251203; Type: TABLE ATTACH; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history ATTACH PARTITION public.price_history_p20251203 FOR VALUES FROM ('2025-12-03 00:00:00+00') TO ('2025-12-10 00:00:00+00');


--
-- Name: price_history_p20251210; Type: TABLE ATTACH; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history ATTACH PARTITION public.price_history_p20251210 FOR VALUES FROM ('2025-12-10 00:00:00+00') TO ('2025-12-17 00:00:00+00');


--
-- Name: price_history_p20251217; Type: TABLE ATTACH; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history ATTACH PARTITION public.price_history_p20251217 FOR VALUES FROM ('2025-12-17 00:00:00+00') TO ('2025-12-24 00:00:00+00');


--
-- Name: price_history_p20251224; Type: TABLE ATTACH; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history ATTACH PARTITION public.price_history_p20251224 FOR VALUES FROM ('2025-12-24 00:00:00+00') TO ('2025-12-31 00:00:00+00');


--
-- Name: price_history_p20251231; Type: TABLE ATTACH; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history ATTACH PARTITION public.price_history_p20251231 FOR VALUES FROM ('2025-12-31 00:00:00+00') TO ('2026-01-07 00:00:00+00');


--
-- Name: price_history_p20260107; Type: TABLE ATTACH; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history ATTACH PARTITION public.price_history_p20260107 FOR VALUES FROM ('2026-01-07 00:00:00+00') TO ('2026-01-14 00:00:00+00');


--
-- Name: price_history_p20260114; Type: TABLE ATTACH; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history ATTACH PARTITION public.price_history_p20260114 FOR VALUES FROM ('2026-01-14 00:00:00+00') TO ('2026-01-21 00:00:00+00');


--
-- Name: price_history_p20260121; Type: TABLE ATTACH; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history ATTACH PARTITION public.price_history_p20260121 FOR VALUES FROM ('2026-01-21 00:00:00+00') TO ('2026-01-28 00:00:00+00');


--
-- Name: price_history_p20260128; Type: TABLE ATTACH; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history ATTACH PARTITION public.price_history_p20260128 FOR VALUES FROM ('2026-01-28 00:00:00+00') TO ('2026-02-04 00:00:00+00');


--
-- Name: price_history_p20260204; Type: TABLE ATTACH; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history ATTACH PARTITION public.price_history_p20260204 FOR VALUES FROM ('2026-02-04 00:00:00+00') TO ('2026-02-11 00:00:00+00');


--
-- Name: price_history_p20260211; Type: TABLE ATTACH; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history ATTACH PARTITION public.price_history_p20260211 FOR VALUES FROM ('2026-02-11 00:00:00+00') TO ('2026-02-18 00:00:00+00');


--
-- Name: comments comment_id; Type: DEFAULT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.comments ALTER COLUMN comment_id SET DEFAULT nextval('public.comments_comment_id_seq'::regclass);


--
-- Name: matches id; Type: DEFAULT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);


--
-- Name: newsletter id; Type: DEFAULT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.newsletter ALTER COLUMN id SET DEFAULT nextval('public.newsletter_id_seq'::regclass);


--
-- Name: settlements id; Type: DEFAULT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.settlements ALTER COLUMN id SET DEFAULT nextval('public.settlements_id_seq'::regclass);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (comment_id);


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
-- Name: newsletter newsletter_email_key; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.newsletter
    ADD CONSTRAINT newsletter_email_key UNIQUE (email);


--
-- Name: newsletter newsletter_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.newsletter
    ADD CONSTRAINT newsletter_pkey PRIMARY KEY (id);


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
-- Name: price_history_default price_history_default_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history_default
    ADD CONSTRAINT price_history_default_pkey PRIMARY KEY (market_id, ts);


--
-- Name: price_history_p20251119 price_history_p20251119_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history_p20251119
    ADD CONSTRAINT price_history_p20251119_pkey PRIMARY KEY (market_id, ts);


--
-- Name: price_history_p20251126 price_history_p20251126_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history_p20251126
    ADD CONSTRAINT price_history_p20251126_pkey PRIMARY KEY (market_id, ts);


--
-- Name: price_history_p20251203 price_history_p20251203_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history_p20251203
    ADD CONSTRAINT price_history_p20251203_pkey PRIMARY KEY (market_id, ts);


--
-- Name: price_history_p20251210 price_history_p20251210_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history_p20251210
    ADD CONSTRAINT price_history_p20251210_pkey PRIMARY KEY (market_id, ts);


--
-- Name: price_history_p20251217 price_history_p20251217_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history_p20251217
    ADD CONSTRAINT price_history_p20251217_pkey PRIMARY KEY (market_id, ts);


--
-- Name: price_history_p20251224 price_history_p20251224_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history_p20251224
    ADD CONSTRAINT price_history_p20251224_pkey PRIMARY KEY (market_id, ts);


--
-- Name: price_history_p20251231 price_history_p20251231_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history_p20251231
    ADD CONSTRAINT price_history_p20251231_pkey PRIMARY KEY (market_id, ts);


--
-- Name: price_history_p20260107 price_history_p20260107_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history_p20260107
    ADD CONSTRAINT price_history_p20260107_pkey PRIMARY KEY (market_id, ts);


--
-- Name: price_history_p20260114 price_history_p20260114_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history_p20260114
    ADD CONSTRAINT price_history_p20260114_pkey PRIMARY KEY (market_id, ts);


--
-- Name: price_history_p20260121 price_history_p20260121_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history_p20260121
    ADD CONSTRAINT price_history_p20260121_pkey PRIMARY KEY (market_id, ts);


--
-- Name: price_history_p20260128 price_history_p20260128_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history_p20260128
    ADD CONSTRAINT price_history_p20260128_pkey PRIMARY KEY (market_id, ts);


--
-- Name: price_history_p20260204 price_history_p20260204_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history_p20260204
    ADD CONSTRAINT price_history_p20260204_pkey PRIMARY KEY (market_id, ts);


--
-- Name: price_history_p20260211 price_history_p20260211_pkey; Type: CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.price_history_p20260211
    ADD CONSTRAINT price_history_p20260211_pkey PRIMARY KEY (market_id, ts);


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
-- Name: idx_comments_account_id; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX idx_comments_account_id ON public.comments USING btree (account_id);


--
-- Name: idx_comments_market_id; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX idx_comments_market_id ON public.comments USING btree (market_id);


--
-- Name: price_history_market_id_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_market_id_ts_idx ON ONLY public.price_history USING btree (market_id, ts DESC);


--
-- Name: price_history_default_market_id_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_default_market_id_ts_idx ON public.price_history_default USING btree (market_id, ts DESC);


--
-- Name: price_history_p20251119_market_id_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_p20251119_market_id_ts_idx ON public.price_history_p20251119 USING btree (market_id, ts DESC);


--
-- Name: price_history_p20251126_market_id_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_p20251126_market_id_ts_idx ON public.price_history_p20251126 USING btree (market_id, ts DESC);


--
-- Name: price_history_p20251203_market_id_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_p20251203_market_id_ts_idx ON public.price_history_p20251203 USING btree (market_id, ts DESC);


--
-- Name: price_history_p20251210_market_id_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_p20251210_market_id_ts_idx ON public.price_history_p20251210 USING btree (market_id, ts DESC);


--
-- Name: price_history_p20251217_market_id_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_p20251217_market_id_ts_idx ON public.price_history_p20251217 USING btree (market_id, ts DESC);


--
-- Name: price_history_p20251224_market_id_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_p20251224_market_id_ts_idx ON public.price_history_p20251224 USING btree (market_id, ts DESC);


--
-- Name: price_history_p20251231_market_id_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_p20251231_market_id_ts_idx ON public.price_history_p20251231 USING btree (market_id, ts DESC);


--
-- Name: price_history_p20260107_market_id_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_p20260107_market_id_ts_idx ON public.price_history_p20260107 USING btree (market_id, ts DESC);


--
-- Name: price_history_p20260114_market_id_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_p20260114_market_id_ts_idx ON public.price_history_p20260114 USING btree (market_id, ts DESC);


--
-- Name: price_history_p20260121_market_id_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_p20260121_market_id_ts_idx ON public.price_history_p20260121 USING btree (market_id, ts DESC);


--
-- Name: price_history_p20260128_market_id_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_p20260128_market_id_ts_idx ON public.price_history_p20260128 USING btree (market_id, ts DESC);


--
-- Name: price_history_p20260204_market_id_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_p20260204_market_id_ts_idx ON public.price_history_p20260204 USING btree (market_id, ts DESC);


--
-- Name: price_history_p20260211_market_id_ts_idx; Type: INDEX; Schema: public; Owner: your_db_user
--

CREATE INDEX price_history_p20260211_market_id_ts_idx ON public.price_history_p20260211 USING btree (market_id, ts DESC);


--
-- Name: price_history_default_market_id_ts_idx; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_market_id_ts_idx ATTACH PARTITION public.price_history_default_market_id_ts_idx;


--
-- Name: price_history_default_pkey; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_pkey ATTACH PARTITION public.price_history_default_pkey;


--
-- Name: price_history_p20251119_market_id_ts_idx; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_market_id_ts_idx ATTACH PARTITION public.price_history_p20251119_market_id_ts_idx;


--
-- Name: price_history_p20251119_pkey; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_pkey ATTACH PARTITION public.price_history_p20251119_pkey;


--
-- Name: price_history_p20251126_market_id_ts_idx; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_market_id_ts_idx ATTACH PARTITION public.price_history_p20251126_market_id_ts_idx;


--
-- Name: price_history_p20251126_pkey; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_pkey ATTACH PARTITION public.price_history_p20251126_pkey;


--
-- Name: price_history_p20251203_market_id_ts_idx; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_market_id_ts_idx ATTACH PARTITION public.price_history_p20251203_market_id_ts_idx;


--
-- Name: price_history_p20251203_pkey; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_pkey ATTACH PARTITION public.price_history_p20251203_pkey;


--
-- Name: price_history_p20251210_market_id_ts_idx; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_market_id_ts_idx ATTACH PARTITION public.price_history_p20251210_market_id_ts_idx;


--
-- Name: price_history_p20251210_pkey; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_pkey ATTACH PARTITION public.price_history_p20251210_pkey;


--
-- Name: price_history_p20251217_market_id_ts_idx; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_market_id_ts_idx ATTACH PARTITION public.price_history_p20251217_market_id_ts_idx;


--
-- Name: price_history_p20251217_pkey; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_pkey ATTACH PARTITION public.price_history_p20251217_pkey;


--
-- Name: price_history_p20251224_market_id_ts_idx; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_market_id_ts_idx ATTACH PARTITION public.price_history_p20251224_market_id_ts_idx;


--
-- Name: price_history_p20251224_pkey; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_pkey ATTACH PARTITION public.price_history_p20251224_pkey;


--
-- Name: price_history_p20251231_market_id_ts_idx; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_market_id_ts_idx ATTACH PARTITION public.price_history_p20251231_market_id_ts_idx;


--
-- Name: price_history_p20251231_pkey; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_pkey ATTACH PARTITION public.price_history_p20251231_pkey;


--
-- Name: price_history_p20260107_market_id_ts_idx; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_market_id_ts_idx ATTACH PARTITION public.price_history_p20260107_market_id_ts_idx;


--
-- Name: price_history_p20260107_pkey; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_pkey ATTACH PARTITION public.price_history_p20260107_pkey;


--
-- Name: price_history_p20260114_market_id_ts_idx; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_market_id_ts_idx ATTACH PARTITION public.price_history_p20260114_market_id_ts_idx;


--
-- Name: price_history_p20260114_pkey; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_pkey ATTACH PARTITION public.price_history_p20260114_pkey;


--
-- Name: price_history_p20260121_market_id_ts_idx; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_market_id_ts_idx ATTACH PARTITION public.price_history_p20260121_market_id_ts_idx;


--
-- Name: price_history_p20260121_pkey; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_pkey ATTACH PARTITION public.price_history_p20260121_pkey;


--
-- Name: price_history_p20260128_market_id_ts_idx; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_market_id_ts_idx ATTACH PARTITION public.price_history_p20260128_market_id_ts_idx;


--
-- Name: price_history_p20260128_pkey; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_pkey ATTACH PARTITION public.price_history_p20260128_pkey;


--
-- Name: price_history_p20260204_market_id_ts_idx; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_market_id_ts_idx ATTACH PARTITION public.price_history_p20260204_market_id_ts_idx;


--
-- Name: price_history_p20260204_pkey; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_pkey ATTACH PARTITION public.price_history_p20260204_pkey;


--
-- Name: price_history_p20260211_market_id_ts_idx; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_market_id_ts_idx ATTACH PARTITION public.price_history_p20260211_market_id_ts_idx;


--
-- Name: price_history_p20260211_pkey; Type: INDEX ATTACH; Schema: public; Owner: your_db_user
--

ALTER INDEX public.price_history_pkey ATTACH PARTITION public.price_history_p20260211_pkey;


--
-- Name: comments fk_market; Type: FK CONSTRAINT; Schema: public; Owner: your_db_user
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_market FOREIGN KEY (market_id) REFERENCES public.markets(market_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


