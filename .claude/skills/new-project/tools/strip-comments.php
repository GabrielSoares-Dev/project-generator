<?php

declare(strict_types=1);

const TYPE_TAGS = ['@param', '@return', '@var', '@throws', '@template', '@phpstan', '@use', '@extends', '@implements'];

function keepTagLines(string $docblock): string
{
    $tagLines = [];

    foreach (explode("\n", $docblock) as $line) {
        $content = trim($line, " \t*/");
        foreach (TYPE_TAGS as $tag) {
            if (str_starts_with($content, $tag)) {
                $tagLines[] = $content;
                break;
            }
        }
    }

    if ($tagLines === []) {
        return '';
    }

    return count($tagLines) === 1
        ? '/** '.$tagLines[0].' */'
        : "/**\n * ".implode("\n * ", $tagLines)."\n */";
}

function strip(string $source, bool $keepDocblockTags): string
{
    $output = '';

    foreach (token_get_all($source) as $token) {
        if (! is_array($token)) {
            $output .= $token;

            continue;
        }

        [$id, $text] = $token;

        if ($id === T_COMMENT) {
            continue;
        }

        if ($id === T_DOC_COMMENT) {
            $output .= $keepDocblockTags ? keepTagLines($text) : '';

            continue;
        }

        $output .= $text;
    }

    return $output;
}

$mode = $argv[1];
$files = array_slice($argv, 2);

foreach ($files as $file) {
    $source = (string) file_get_contents($file);
    $isController = str_contains(str_replace('\\', '/', $file), 'Http/Controllers/');
    $result = $isController && $mode === 'tags' ? $source : strip($source, $mode === 'tags');
    file_put_contents($file, $result);
}
